export default {
	register_pending_patient: async (patient_obj) => {
		const first_name = patient_obj["First Name"];
		const last_name = patient_obj["Last Name"];
		const gender = patient_obj["Gender"]?.charAt(0).toUpperCase() == "M" ? "MALE" : patient_obj["Gender"]?.charAt(0).toUpperCase() == "F" ? "FEMALE" : "OTHER";
		let dob = this.convertDOB(patient_obj["Date of Birth"])
		let dob_split = dob.split('-');
		const date_of_birth = `${dob_split[1]}/${dob_split[2]}/${dob_split[0]}`;
		const member_id = patient_obj["Member ID"];
		try {
			await paysign_patient_registration.run({first_name: first_name, last_name: last_name, gender: gender, date_of_birth: date_of_birth, member_id: member_id});
			showAlert("Patient registration successful." + paysign_patient_registration.data);
		} catch (e) {
			showAlert("Error while registering patient. " + e);
		}
	},
	reset_patient_pw_after_validation: async (member_id, new_password_hash) => {
		try {
			if (!this.is_valid_patient_credentials(member_id, new_password_hash)) {
				return
			}

			showAlert(`Resetting password for member ${patient_lookup_table.triggeredRow["Member ID"]} to ${new_password_hash}`)

			await patient_password_reset_api.run({
				"patient_id": patient_lookup_table.triggeredRow["Database ID"]?.toString() || "",
				"member_id": patient_lookup_table.triggeredRow["Member ID"]?.toString() || "",
				"new_password_hash": new_password_hash
			});

			showAlert(patient_password_reset_api.data?.result ? `Password successfully reset to ${new_password_hash}` : "Password reset failed");		
		} catch (err) {
			console.log(err)
			showAlert("Password reset failed");		
		}	
	},
	reset_patient_pw: async (member_id, new_password_hash, patient_id, enrollment_status) => {
		try{
			// see if user login is valid using current member id 
			const validate_user_res = await validate_user_api.run(member_id)

			if (validate_user_res?.message.toLowerCase() === "login found") {
				// reset pw since user validated
				this.reset_patient_pw_after_validation(member_id, new_password_hash);
			} else {
				// user login not found, create user login before calling pw reset 
				const user_type = "patient";
				// call api to create login
				const add_user_api_response = await add_user_api.run({login_id: member_id, password_hash: new_password_hash, user_type: user_type, xref_id: patient_id});
				const update_patient_api_response = await update_patient_api.run({update_payload: {
					patient_id: patient_id,
					member_id: member_id,
					enrollment_status: enrollment_status,
					credentials_id: member_id
				}})

				showAlert(add_user_api_response?.message !== "User created" ? `Password successfully reset to ${new_password_hash}` : "Password reset failed");			
				if (update_patient_api_response?.message !== "Patient updated") {
					console.log(`Failed to update credentials_id when creating user for patient_id: ${patient_id}, member_id: ${member_id}`)
				}
			}
		} catch (e) {
			showAlert("Error encountered " + e.message);
		}
	},
	is_valid_patient_credentials: (member_id, new_password_hash) => {
		if (member_id === "") {
			showAlert("Cannot reset password for this patient, missing Member ID")
			return false
		} else if (!new_password_hash.match(/^[A-Z]{2}\d{5}$/)) {
			showAlert("Cannot reset password for this patient, missing First Name, Last Name, or Zipcode")
			return false
		}

		return true
	},
	confirm_and_update_enrollment_status: async (confirm_text, new_enrollment_status) => {
		// update card enrollment status in db and card status at paysign after confirmation 
		if (confirm_text === 'confirm') {

			try {
				// update database enrollment status automatically
				await this.update_enrollment_status(patient_lookup_table.selectedRow["Database ID"], patient_lookup_table.selectedRow["Member ID"], new_enrollment_status);
				showAlert("Enrollment Status Change Successfuly Set to: " + new_enrollment_status);

				// get card status 
				await paysign_get_card_details.run({member_id: patient_lookup_table.selectedRow["Member ID"]});
				const card_detail = paysign_get_card_details.data;
				const card_status = card_detail?.card_status || ""; 

				// check if card status needs to be updated and update accordingly --> paysin "A" is Active and "I" is Inactive
				let new_status; 
				if (new_enrollment_status == "Active") {
					new_status = "A";
					// if previous status was pending, register patient in paysign by submitting patient info to associate with member id 
					// before submitting patient info, do a call to api to get card status so don't have to register patient if card status is already active 
					if (card_status == "Active") {
						showAlert("Patient card status is already Active.")
					} else if (card_status == "Inactive") {
						// change to active status
						await update_card_status.run({member_id: patient_lookup_table.selectedRow["Member ID"], card_status: new_status});
						showAlert("Card Status Successfully Set to: " + new_enrollment_status);									 
					} else {
						// register pending  patient to pair patient info to card # (if card not active or inactive, must be pending)
						this.register_pending_patient( patient_lookup_table.selectedRow );
					}

				} else if (new_enrollment_status == "Inactive") {
					new_status = "I";

					if (card_status == "Active") {
						// change to Inactive status
						await update_card_status.run({member_id: patient_lookup_table.selectedRow["Member ID"], card_status: new_status});
						showAlert("Card Status Successfully Set to: " + patient_status_sel.selectedOptionLabel);									 
					} else if (card_status == "Inactive") {
						showAlert("Patient card status is already Inactive.")
					} else {
						// No need to register card if making inactive
					} 
				} else if (new_enrollment_status == "Pending") {
					new_status = "I";					
					if (card_status == "Active") {
						// change to Inactive status
						await update_card_status.run({member_id: patient_lookup_table.selectedRow["Member ID"], card_status: new_status});
						showAlert("Card Status Successfully Set to: " + new_enrollment_status);									 
					} else if (card_status == "Inactive") {
						showAlert("Patient card status is already Inactive.")
					} else {
						// No need to register card if set Pending
					}
				}

			} catch(e) {
				showAlert("Card Update Failed " + e.message);
			}
		} else {
			showAlert("Please type 'confirm' and Press Update to Change Enrollment Status")
		}
	},
	update_patient_enrollment_status: async (patient_id, drug_patient, drug_admin_patient, enrollment_status) => {
		// use this to update enrollment status that includes drug and drug amin Y/N but just need to update logic to include those fields
		if (!patient_id) {
			showAlert("Please Close this Modal and Make Sure to Highlight Patient in Lookup Table");
			return;
		}

		if (!drug_patient || !drug_admin_patient || !enrollment_status) {
			showAlert("Drug Patient, Drug-Admin Patient, and Enrollment Status Cannot be Blank.");
			return;
		}
		try {
			await patient_status_update_api.run({patient_id: patient_id, drug_patient: drug_patient, drug_admin_patient: drug_admin_patient, enrollment_status: enrollment_status});
			showAlert("Patient Status Update Api Complete " + patient_status_update_api.data);
		} catch (e) {
			showAlert("Error calling patient status update api " + e.message);
		}

	},
	update_patient_status_select: (admin_status, drug_admin_status)	=> {
		// Use this to update enrollment status and drug and drug-admin status
		// showAlert(admin_status.trim().toUpperCase())
		// showAlert(drug_admin_status.trim().toUpperCase())
		if ("N" == admin_status.trim().toUpperCase() && "N" == drug_admin_status.trim().toUpperCase()) {
			showAlert("Updating will change enrollment status to inactive");
			storeValue("enrollment_status", "Inactive");
		} else {
			showAlert("Updating will change enrollment status to active")
			storeValue("enrollment_status", "Active");
		}
	},		
	put_parsed_patient_data_into_store: (patient_obj) => {

		storeValue('patient_provider_data', patient_obj.patient_provider_data);
		storeValue('provider_data', patient_obj.provider_data);
		storeValue('enrollment_data', patient_obj.patient_enrollment);
		storeValue('commercial_insurance', patient_obj.commercial_insurance);
		storeValue('patient_benefits_amounts', patient_obj.patient_benefits_amounts);
		storeValue('card_data', patient_obj.card_data);

		storeValue("patient_lap", patient_obj.patient_lap);

		storeValue('verification_data', patient_obj.verification_data);


		// storeValue("patient_enrollment", patient_lookup_table.selectedRow["patient_enrollment"]);
		// storeValue("patient_lap", patient_lookup_table.selectedRow["patient_lap"]);				
		// storeValue("patient_provider_data", patient_lookup_table.selectedRow["patient_provider_data"]);
		// storeValue("patient_commercial_insurance", patient_lookup_table.selectedRow["patient_commercial_insurance"]);
		// storeValue("patient_benefits_amounts", patient_lookup_table.selectedRow["patient_benefits_amounts"]);			
		// storeValue("card_data", patient_lookup_table.selectedRow["card_data"]);

		// storeValue("provider_data", patient_lookup_table.selectedRow.provider_data || "")
		// 
		// storeValue("enrollment_status", patient_lookup_table.selectedRow["Enrollment Status"])
	},
	map_patient: (patients) => {
		const mapped_patients = patients.map(function (search_result) {
			const enrollment_data = JSON.parse(search_result?.enrollment_data || "{}");
			// console.log("processed enrollment data", JSON.stringify(enrollment_data));
			const patient_provider_data = JSON.parse(search_result?.patient_provider_data || "{}");
			// storeValue('patient_provider_data', patient_provider_data);
			// console.log("patient provider data", JSON.stringify(patient_provider_data));
			const provider_data = JSON.parse(search_result?.provider_data || "{}");
			// storeValue('provider_data', provider_data);
			// console.log("provider data", JSON.stringify(provider_data));
			const lap = enrollment_data?.lap || "{}";
			// storeValue('enrollment_data', lap);
			// console.log("lap data", JSON.stringify(enrollment_data));
			const commercial_insurance = enrollment_data?.commercial_insurance || "{}";
			// storeValue('commercial_insurance', commercial_insurance);
			// console.log("commercial_insurance", JSON.stringify(commercial_insurance));
			const benefits_amounts = search_result?.benefits_amounts || "{}";
			// storeValue('benefits_amounts', benefits_amounts);
			// console.log("benefits_amounts", JSON.stringify(benefits_amounts));
			const card_data = JSON.parse(search_result?.card_data || "{}");
			// storeValue('card_data', card_data);
			// console.log("card_data", JSON.stringify(card_data));
			const verification_data = JSON.parse(search_result?.verification_data || "{}");
			// delete enrollment_data["lap"];
			// storeValue('enrollment_data', enrollment_data);
			return {
				"Enrollment Status": search_result?.enrollment_status ||"",
				"Database ID": search_result?.patient_id || "",
				"Member ID": search_result?.member_id || "",
				"Prior Member ID": search_result?.prior_member_id || "",
				"Drug Patient": search_result?.drug_patient || "",
				"Drug Admin Patient": search_result?.drug_admin_patient || "",
				"Original Enrollment Date Drug": search_result?.original_enrollment_date_drug || "",
				"Original Enrollment Date Drug Admin": search_result?.original_enrollment_date_drug_admin || "",
				"Current Enrollment Date Drug": search_result?.current_enrollment_date_drug || "",
				"Current Enrollment Date Drug Admin": search_result?.current_enrollment_date_drug_admin || "",
				"Enrollment Source": search_result?.enrollment_source || "",
				"First Name": enrollment_data?.first_name || "",
				"Last Name": enrollment_data?.last_name || "",
				"Date of Birth": enrollment_data?.date_of_birth || "",
				"Gender": enrollment_data?.gender || "",
				"Phone": enrollment_data?.phone_number || lap?.phone_number || "",
				// "Address":
				// (enrollment_data.Address["Address 1"] || "") + (enrollment_data.Address["Address 2"] || ""),
				// (enrollment_data.address?.city ? ` ${enrollment_data.address?.city}` : "") +
				// (enrollment_data.address?.state ? ` ${enrollment_data.address?.state}` : "") +
				// (enrollment_data.address?.zip_code ? ` ${enrollment_data.address?.zip_code}` : ""),
				// "Zipcode": enrollment_data?.Address["Zip Code"] || "",
				// "Zipcode": enrollment_data?.address?.zip_code || enrollment_data?.address["Zip Code"] || search_result.zip_code_v || "",
				"Email": enrollment_data?.email || "",
				// "Primary Provider NPI": provider_data?.primary[0]?.provider_npi || "",
				// "Primary Provider Name": `${patient_provider_data?.first_name || ""} ${patient_provider_data?.fast_name || ""}`.trim(),
				// "Verification Data": enrollment_data?.verification_data || "",
				// "Credentials Data": enrollment_data?.credentials_id || "",
				// "Patient Data": enrollment_data?.patient_data || "",

				"Card Pii": enrollment_data?.card_pii || "",
				"Eligibility Data": enrollment_data?.eligibility_data || "",
				"patient_enrollment": enrollment_data || "",
				"provider_data": provider_data || "",
				"patient_lap": lap || "",				
				"patient_provider_data": patient_provider_data || "",
				"patient_commercial_insurance": commercial_insurance || "",
				"patient_benefits_amounts": benefits_amounts || "",		
				"card_data": card_data || "",
				"verification_data": verification_data || "",
				"credentials_id": search_result?.credentials_id || ""
			};
		});		
		return mapped_patients;
	},
	patient_lookup: async (inputText, selectedOptionValue, start_date, end_date) => {
		// `inputText, selectedOptionValue, start_date, end_date`
		// patient_lookup_txt.text, patient_lookup_list.selectedOptionValue, "", ""
		// showAlert(inputText);
		// showAlert(selectedOptionValue);
		// showAlert("member_id");
		// showAlert(inputText + selectedOptionValue == "member_id");
		// inputText = "Bettina";
		// selectedOptionValue = "first_name";
		// let start_date = "";
		// let end_date = "";
		// let inputText = patient_lookup_txt.text;
		// let selectedOptionValue = patient_lookup_list.selectedOptionValue;
		showAlert("Enter date ",inputText, selectedOptionValue, start_date,end_date )
		let search_results = [];
		try {
			// search text and option value blank so validate for searching by enrollment date
			if (!inputText && !selectedOptionValue) {
				// validate date fields for enrollment search
				const result = await listAllPatients.run()
				search_results = result;
				const mapped_patients = this.map_patient(result);
			  await storeValue("mapped_patients", mapped_patients);
				return search_results;
			};
			// start and end dates blank so validate regular lookup
			if (!start_date && !end_date)	{
				if (!inputText) {
					// validate fields for input text search 
					showAlert("Please enter text value to search.");
					return [];		
				}
			};


			if (start_date && end_date) {

				showAlert("Searching enrollments from " + start_date + " to " + end_date);
				start_date = "'" + start_date.toString() + "'";
				end_date = "'" + end_date.toString() + "'";
				storeValue('enrollment_start_date', start_date);
				storeValue('enrollment_end_date', end_date);
				showAlert("getting search results")
				await get_patients_by_enrollment_dt.run({start_date: start_date, end_date: end_date});
				search_results = get_patients_by_enrollment_dt.data;
			} else {
				// showAlert(selectedOptionValue, selectedOptionValue === "member_id")
				if (selectedOptionValue === "member_id") {
					const res = await get_patient_by_member_id.run({member_id: inputText});
					if (!res) {
						showAlert("Member ID not found");
					} else {
						search_results.push(res);
					}
				} else {
					if (selectedOptionValue === "dob") {
						inputText = this.convertDOB(inputText);
					} 
					// search_results = await patient_search_api.run( {selected_option_value: selectedOptionValue, input_text: inputText});	
					search_results = await patient_search_api.run();	
					// search_results = await this.get_patients(inputText, selectedOptionValue);	
					if (!search_results) { showAlert("No results found"); return; }
					else {
						showAlert(search_results);
					}
				}
			}
			showAlert("mapping search results")
			const mapped_patients = this.map_patient(search_results);
			storeValue("mapped_patients", mapped_patients);
			return mapped_patients;
		} catch (e) {
			showAlert(e.message);
			return [];
		}
	},
	lookup_pending_duplicate_patient_status: 	async () => {
		showAlert("getting search results")
		await get_patients_pend_dup_status.run();
		const search_results = get_patients_pend_dup_status.data;
		showAlert("mapping search results")
		const mapped_patients = this.map_patient(search_results);
		storeValue("mapped_patients", mapped_patients);
	},
	convertDOB: (dob) => {
		// dob = '06/02/1999';
		const newDOB = new Date(dob);
		try {
			if (newDOB.getTime() <= new Date().getTime()) {
				showAlert(newDOB.toISOString().split("T")[0]);
				return newDOB.toISOString().split("T")[0];
			} else {
				return new Date(newDOB.setFullYear(newDOB.getFullYear() - 100)).toISOString().split("T")[0];
			}
		} catch (e) {
			return dob;
		}
	},
	get_attestation: async (tab_name, patient_id) => {
		await get_patient_attestation.run({patient_id: patient_id});
		const attestation = get_patient_attestation.data[0];
		// await setTimeout(showAlert("Processing"), 1500);
		// showAlert(get_patient_attestation.data.length);
		if (get_patient_attestation.data.length == 0) {
			storeValue("attestation_obj", {"provider_npi": "", "spoke_with": "", "date_of_attestation": ""});
			// attestation_has_gov_ins_sel.setValue("");
			attestation_spoke_with_inp.setValue("");
			attestation_date_pkr = null;
		} else {
			storeValue("attestation_obj", {"provider_npi": attestation.provider_npi, "spoke_with": attestation.spoke_with, 
																		 "date_of_attestation": attestation.date_of_attestation});				
		}

	},
	update_active_tab: async (tab_name, id) => {

		const patient_id = id.toString();
		// put this code in on row select for patient lookup table: patient_helper_obj.update_active_tab(detail_tab.selectedTab);
		if ( "Patient Detail" == tab_name.trim() ) { 
			// don't need to do anything, data being pulled from storeValue() patient_obj

			// showAlert(tab_name + " clicked " + " == Patient Detail")
			// use id but need to check that DC's code is ok to use database id of patient
			// await patient_details_obj.get_patient_profile(id);
			// await patient_details_obj.get_patient_caregiver_info(id);
			// await patient_details_obj.get_patient_enrollment_details(id);
			await get_patient_attestation.run({patient_id: patient_id});
		} else if (tab_name == "Communications") {
			// showAlert(tab_name + " clicked " + " == Communications" + " id " + patient_id);
			await this.get_patient_communication_details(patient_id);
		} else if ( "Claims" == tab_name.trim() ) {
			await this.get_patient_claims_details(patient_id);
		} else if ( "Notes" == tab_name.trim() ) {
			// showAlert(tab_name + " clicked " + " == Notes");
			await get_patient_notes.run({patient_id: patient_id});
		} else if ( "Insurance" == tab_name.trim() ) {
			// showAlert(tab_name + " clicked " + " == Insurance");
			await this.display_insurance_info(patient_id);
		} else if ( "Omni Check" == tab_name.trim() ) {
			// showAlert(tab_name + " clicked " + " == Omni Check" + " id " + patient_id);
			const omni_check_history = await this.get_patient_omni_check_history(id);
			// showAlert(omni_check_history);
			storeValue("omni_check_obj", omni_check_history);

		}

		// } else if (tab_name == "Attachments") {
		// await get_patient_attachments.run({patient_id: patient_lookup_table.selectedRow["Database ID"]}) }

	},
	display_insurance_info: async (id) => {

		if (!id) return [];
		// id = patient_lookup_table.selectedRow["Database ID"];
		// display 
		await get_patient_insurance.run({patient_id: id}); 
	},
	add_insurance: async (patient_id, insurance_type, plan_name, plan_type, plan_bin, plan_pcn, plan_group, plan_id, plan_start_date, plan_end_date, commercial_or_government) => {

		if (!patient_id) {
			showAlert("Patient Name Must be Selected");
			return
		}
		if (!insurance_type || !plan_name || !plan_type || !plan_bin || !plan_pcn || !plan_group || 
				!plan_id || !plan_start_date || !plan_end_date || !commercial_or_government) {
			showAlert("All Fields Must Not Be Empty, Null, or be 0");
			return;
		}
		try {
			add_patient_insurance.run({
				patient_id: patient_id, insurance_type: insurance_type, plan_name: plan_name, plan_type: plan_type, 
				plan_bin: plan_bin, plan_pcn: plan_pcn, plan_group: plan_group, plan_id: plan_id, plan_start_date: plan_start_date, 
				plan_end_date: plan_end_date, commercial_or_government: commercial_or_government	
			})
			await get_patient_insurance.run({patient_id: patient_id});	
			showAlert("Insurance Added Successfully");
			closeModal('mdlAddInsurance');
		} catch (e) {
			showAlert("Error adding insurance " + e.name + e.message);
		}

	},
	update_insurance: async (o) => {
		// id, patient_id, insurance_type, plan_name, plan_type, plan_bin, plan_pcn, plan_group, plan_id, plan_start_date, plan_end_date, commercial_or_government, created

		if (!o.id) {
			showAlert("Patient Insurance Name Must be Selected");
			return
		}
		if (!o.patient_id || !o.insurance_type || !o.plan_name || !o.plan_type || !o.plan_bin || !o.plan_pcn || !o.plan_group || 
				!o.plan_id || !o.plan_start_date || !o.plan_end_date || !o.commercial_or_government || !o.created) {
			showAlert("All Fields Must Not Be Empty, Null, or be 0");
			return;
		}
		if (o.insurance_type != "Medical" & o.insurance_type != "Pharmacy") {
			showAlert("Insurance Type must be Medical or Pharmacy");
			return;			
		}

		if (!moment(o.plan_start_date, "YYYY-MM-DD", true).isValid()) {
			showAlert("Plan Start Date must be a valid date in the YYYY-MM-DD format");
			return;					
		}

		if (!moment(o.plan_end_date, "YYYY-MM-DD", true).isValid()) {
			showAlert("Plan End Date must be a valid date in the YYYY-MM-DD format");
			return;					
		}

		update_patient_insurance.run({
			id: o.id, patient_id: o.patient_id, insurance_type: o.insurance_type, plan_name: o.plan_name, plan_type: o.plan_type, 
			plan_bin: o.plan_bin, plan_pcn: o.plan_pcn, plan_group: o.plan_group, plan_id: o.plan_id, plan_start_date: o.plan_start_date, 
			plan_end_date: o.plan_end_date, commercial_or_government: o.commercial_or_government	
		})
		showAlert("Insurance Updated Successfully");
		insurance_tbl.updatedRowIndices.pop();
		await get_patient_insurance.run({patient_id: o.patient_id});
	},
	confirm_update_card_status: (confirm) => {
		showAlert(confirm);
		if (confirm !== 'confirm') {
			showAlert("Your input ''" + confirm + "' does not match 'confirm'. Please retype and try again.");
			return;
		}

		this.update_card_status(appsmith.store.patient_id, appsmith.store.patient_status);
	},
	update_card_status: async (member_id, card_status) => {
		// only updates card status at paysign
		if (!member_id) {
			showAlert("Patient must be Selected in Lookup Table");
			return;
		}
		if (!status) {
			showAlert("Please Select a Card Status");
			return;
		}
		try {
			await update_card_status.run({member_id: member_id, card_status: card_status});
			showAlert("Card Update Successful \n" + status);
		} catch(e) {
			showAlert("Card Update Failed " + e.message + " " + status);
		}
	},
	update_enrollment_status: async (patient_id, member_id, enrollment_status) => {
		// use this to update enrollment status only - leaving drug and drug admin as is
		if (!patient_id) {
			showAlert("Patient must be Selected in Lookup Table");
			return;
		}
		if (!enrollment_status) {
			showAlert("Please Select an Enrollment Status");
			return;
		}
		try {
			await update_patient_enr_status_api.run({patient_id: patient_id, member_id: member_id, enrollment_status: enrollment_status});
			showAlert("Enrollment Status Update Successful \n" + update_patient_enr_status_api.data);
		} catch(e) {
			showAlert("Enrollment Status Update Failed " + e.message);
		}
	},
	update_member_id: async (patient_id, new_member_id) => {
		// use this function to update member id
		if (!patient_id) {
			showAlert("Patient must be Selected in Lookup Table");
			return;
		}
		if (!new_member_id) {
			showAlert("Please Enter a new Member ID");
			return;
		}
		try {
			await update_patient_member_id_api.run({patient_id: patient_id, new_member_id: new_member_id});
			showAlert("Enrollment Status Update Successful \n" + update_patient_enr_status_api.data);
		} catch(e) {
			showAlert("Enrollment Status Update Failed " + e.message);
		}
	},	
	get_patient_omni_check_history: async (patient_db_id) => {
		await get_patient_omni_check_history.run({patient_id: patient_db_id});
		const omni_check_results = get_patient_omni_check_history.data;
		if (!omni_check_results) {
			return {
				"User": "",
				"Determination Date": "",
				"Determination": ""

			};
		}

		return omni_check_results.map(function (omni_check_result) {
			const transaction_info = JSON.parse(omni_check_result?.TransactionInfo || "{}");
			showAlert(transaction_info);		
			return {
				"User": transaction_info?.user_name || "",
				"Determination Date": transaction_info?.created || "",
				"Determination": transaction_info?.determination || ""

			};
		});	
	},
	run_omni_check_min: async (o) => {
		console.log(o);
		if (!o) {
			showAlert("Patient Must be Selected in Patient Lookup Table");
			return;
		}
		// const o = patient_obj;
		// turn any id int into string for storing later (may need to convert back to int to find match in orginal table)
		const patient_db_id = o["Database ID"].toString();
		const member_id = o["Member ID"]
		const first_name = o["First Name"];
		const last_name = o["Last Name"];
		const dob = o["Date of Birth"];
		let gender = "Female";
		if ("M" === o.Gender.toUpperCase()) gender = "Male";

		const zip = o.Zipcode;

		let eligibility;
		let sent_json;
		try {
			const res = await this.get_aws_token_and_run_omni_check(first_name, last_name, gender, dob, zip); 

			showAlert(res);
			// showAlert(res.responseMeta.isExecutionSuccess);
			console.log('EnrollmentStatus', res?.TransactionInfo?.EnrollmentStatus);
			eligibility = res?.TransactionInfo?.EnrollmentStatus || null;
			if (!eligibility) {
				showAlert("No eligibility result returned " + JSON.stringify(res));
			}
			sent_json = {"patient_first_name": first_name, "patient_last_name": last_name, "patient_dob": dob, "patient_gender": gender, "patient_zip": zip};

			try {
				// save result to database
				await add_omni_check_result.run({user_name: appsmith.user.email, patient_id: patient_db_id, determination: eligibility, submission_json: 		JSON.toString(sent_json), response_json: JSON.toString(res)});
				let enrollment_status;
				if ('eligible' === eligibility?.toLowerCase() || "") {
					// automatically make patient status active if eligibility passed
					enrollment_status = 'Active';
					// update enrollment status and card status
					await this.confirm_and_update_enrollment_status('confirm', enrollment_status); 
					// await this.update_enrollment_status(patient_db_id, member_id, enrollment_status);
					showAlert("Determination: Eligible. Patient Enrollment and Card Status will be Automatically Updated to Active");

					// } else if ('not ineligible' === eligibility?.toLowerCase() || "") {
					// // automatically make patient status inactive if  is determined not eligible
					// enrollment_status = 'Inactive';
					// await this.update_enrollment_status(patient_db_id, member_id, enrollment_status);
					// showAlert("Determination: Not Eligible. Patient Enrollment Status will be Automatically Updated to Inactive");	
				} else {
					// automatically make patient status inactive if eligibility not determined or is determined not eligible
					enrollment_status = 'Inactive';
					await this.confirm_and_update_enrollment_status('confirm', enrollment_status);					
					// await this.update_enrollment_status(patient_db_id, member_id, enrollment_status);
					showAlert("Determination: " + eligibility + ". Patient Enrollment and Card Status will be Automatically Updated to Inactive");	
					// showAlert("Determination: " + eligibility);
				}	
				// refresh patient omni-check history data
				this.get_patient_omni_check_history(patient_db_id);			

			}	catch (e) {
				showAlert( "Omni-Check Save Unsuccessful " + e.message );
				return {
					"User": "",
					"Determination Date": "",
					"Determination": ""

				};
			}

		} catch (e) {
			showAlert("Error during omni-check " + e.message);
			return {
				"User": "",
				"Determination Date": "",
				"Determination": ""

			};
		}

	},
	get_aws_token_and_run_omni_check: async (first_name, last_name, gender, dob, zip) => {
		await get_aws_omni_check_credentials.run();
		const credentials = get_aws_omni_check_credentials.data;
		if (!credentials) {
			showAlert("Unable to retrieve Credentials for AWS Token Call");
			return;
		}
		const omni_check_url = "https://api.prevail1.com/hemlibra/new-enrollment";
		const aws_token_url = "https://prevailone.auth.us-west-2.amazoncognito.com/oauth2/token";

		const key = credentials[0].pw_key;
		const secret = credentials[0].pw_secret;
		let access_token = "";
		let token_type = "";
		// get token first
		await fetch(aws_token_url, {
			method: 'POST',
			body: 'grant_type=client_credentials&client_id=' + key + '&client_secret=' + secret,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}).then(function (resp) {
			// Return the response as JSON
			return resp.json();
		}).then(function (data) {
			// Log the API data
			// console.log('token', data);
			access_token = data?.access_token;
			token_type = data?.token_type;
		}).catch(function (err) {
			// Log any errors
			console.log('something went wrong', err);
		});		

		// use token to run omni-check
		return await fetch(omni_check_url, {
			method: 'POST',
			body: JSON.stringify({
				PatientPersonalInfo: {
					FirstName: first_name,
					LastName: last_name,
					DateOfBirth: dob,
					Gender: gender,
					Zipcode: zip,
				},
				CardRequestInfo: {
					Type: "",
				}
			}),
			headers: {
				'Content-Type': 'application/json',
				'Authorization': token_type + " " + access_token,
				'Connection': 'keep-alive',
				'Accept-Encoding': 'Accept-Encoding',
				'Accept': '*/*',
			}
		}).then(function (resp) {
			// Return the response as JSON
			return resp.json();
		}).then(function (data) {
			// Log the API data
			console.log('omni-check result', data);
			console.log('EnrollmentStatus', data?.TransactionInfo?.EnrollmentStatus);
			// return omni check results as json object
			return data;
		}).catch(function (err) {
			// Log any errors
			console.log('something went wrong during omnicheck', err);
			return {};
		});			
	},
	add_new_attestation: async(attestation_obj) => {
		const patient_id = attestation_obj.patient_id;
		const provider_npi = attestation_obj.provider_npi;
		const spoke_with = attestation_obj.spoke_with;
		const covered_by_government_insurance = attestation_obj.covered_by_government_insurance;
		const date_of_attestation = attestation_obj.date_of_attestation;
		const provider_type = attestation_obj.provider_type;
		const demographic_confirmed = attestation_obj.demographic_confirmed;
		const attest_to_not_use_gov_reimbursement = attestation_obj.attest_to_not_use_gov_reimbursement;		

		// showAlert(JSON.stringify(attestation_obj));

		if (!patient_id) {
			showAlert("Please select a patient in the lookup table and make sure it is highlighted");
			return;
		};

		if (!provider_npi || !spoke_with || !covered_by_government_insurance || !date_of_attestation || !provider_type || !demographic_confirmed || !attest_to_not_use_gov_reimbursement) {
			showAlert("All fields must be completed and have a value");
			return;
		};
		let isnum = provider_npi.match(/^[0-9]+$/) !== null;
		if (provider_npi.length != 10 || !isnum) {
			showAlert("Provider NPI Must be 10 digits");
			return;
		};

		// add new one
		try {
			add_patient_attestation.run({user_name: appsmith.user.username, patient_id: patient_id, provider_npi: provider_npi, spoke_with: spoke_with, covered_by_government_insurance: covered_by_government_insurance, date_of_attestation: date_of_attestation, provider_type: provider_type, demographic_confirmed: demographic_confirmed, attest_to_not_use_gov_reimbursement: attest_to_not_use_gov_reimbursement});
			// call get api to refresh table
			get_patient_attestation.run({patient_id: patient_id});
			showAlert("Add Patient Provider Attestation Successful");

			// check questionnaire to qualify for auto-activation of patient enrollment and card 
			if (provider_type == "PO" && demographic_confirmed == 'Y' && attest_to_not_use_gov_reimbursement == 'Y') {
				const enrollment_status = 'Active';
				// update enrollment status and card status
				await this.confirm_and_update_enrollment_status('confirm', enrollment_status); 
				// await this.update_enrollment_status(patient_db_id, member_id, enrollment_status);
				showAlert("Attestation Succes: Eligible. Patient Enrollment and Card Status will be Automatically Updated to Active");				
			}

		} catch (e) {
			showAlert("Error while adding patient provider attestation " + e.message);
		}


	},
	update_attestation: async(attestation_obj) => {
		// patient_id, provider_npi, spoke_with, date_of_attestation
		const id = attestation_obj.id;
		const patient_id = attestation_obj.patient_id;
		const provider_npi = attestation_obj.provider_npi;
		const spoke_with = attestation_obj.spoke_with;
		const covered_by_government_insurance = attestation_obj.covered_by_government_insurance;
		const date_of_attestation = attestation_obj.date_of_attestation;
		const provider_type = attestation_obj.provider_type;
		const demographic_confirmed = attestation_obj.demographic_confirmed;
		const attest_to_not_use_gov_reimbursement = attestation_obj.attest_to_not_use_gov_reimbursement;		

		showAlert(JSON.stringify(attestation_obj));

		if (!patient_id) {
			showAlert("Please select a patient attestation in the attestation history table and make sure it is highlighted");
			return;
		};

		if (!provider_npi || !spoke_with || !covered_by_government_insurance || !date_of_attestation || !provider_type || !demographic_confirmed || !attest_to_not_use_gov_reimbursement) {
			showAlert("All fields must be completed and have a value");
			return;
		};
		let isnum = provider_npi.match(/^[0-9]+$/) !== null;
		if (provider_npi.length != 10 || !isnum) {
			showAlert("Provider NPI Must be 10 digits");
			return;
		};
		// previous attestation, just update
		try {
			update_patient_attestation.run({id: id, user_name: appsmith.user.username, patient_id: patient_id, provider_npi: provider_npi, spoke_with: spoke_with, covered_by_government_insurance: covered_by_government_insurance, date_of_attestation: date_of_attestation, provider_type: provider_type, demographic_confirmed: demographic_confirmed, attest_to_not_use_gov_reimbursement: attest_to_not_use_gov_reimbursement});
			get_patient_attestation.run({patient_id: patient_id});
			showAlert("Update Patient Provider Attestation Successful");

			// check questionnaire to qualify for auto-activation of patient enrollment and card 
			if (provider_type == "PO" && demographic_confirmed == 'Y' && attest_to_not_use_gov_reimbursement == 'Y') {
				const enrollment_status = 'Active';
				// update enrollment status and card status
				await this.confirm_and_update_enrollment_status('confirm', enrollment_status); 
				// await this.update_enrollment_status(patient_db_id, member_id, enrollment_status);
				showAlert("Attestation Succes: Eligible. Patient Enrollment and Card Status will be Automatically Updated to Active");				
			}			
		} catch (e) {
			showAlert("Error while updating patient provider attestation " + e.message);
		}
	},
	save_attestation: async (attestation_obj) => {
		// used previously for logic to only store 1 attestation per patient - cannot use for multiple attestations
		// patient_id, provider_npi, spoke_with, date_of_attestation
		const patient_id = attestation_obj.patient_id;
		const provider_npi = attestation_obj.provider_npi;
		const spoke_with = attestation_obj.spoke_with;
		const covered_by_government_insurance = attestation_obj.covered_by_government_insurance;
		const date_of_attestation = attestation_obj.date_of_attestation;
		const provider_type = attestation_obj.provider_type;
		const demographic_confirmed = attestation_obj.demographic_confirmed;
		const attest_to_not_use_gov_reimbursement = attestation_obj.attest_to_not_use_gov_reimbursement;		

		showAlert(JSON.stringify(attestation_obj));

		if (!patient_id) {
			showAlert("Please select a patient in the lookup table and make sure it is highlighted");
		};

		if (!provider_npi || !spoke_with || !covered_by_government_insurance || !date_of_attestation || !provider_type || !demographic_confirmed || !attest_to_not_use_gov_reimbursement) {
			showAlert("All fields must be completed and have a value");
		};
		let isnum = provider_npi.match(/^[0-9]+$/) !== null;
		if (provider_npi.length != 10 || !isnum) {
			showAlert("Provider NPI Must be 10 digits");
		};

		// check if previous attestation exists so as to add or update (only 1 attestation per patient)
		await get_patient_attestation.run({patient_id: patient_id});
		const previous_attestation = get_patient_attestation.data; 
		if (previous_attestation.length == 0) {
			// no previous attestation, add new one
			try {
				add_patient_attestation.run({user_name: appsmith.user.username, patient_id: patient_id, provider_npi: provider_npi, spoke_with: spoke_with, covered_by_government_insurance: covered_by_government_insurance, date_of_attestation: date_of_attestation, provider_type: provider_type, demographic_confirmed: demographic_confirmed, attest_to_not_use_gov_reimbursement: attest_to_not_use_gov_reimbursement});
				get_patient_attestation.run({patient_id: patient_id});
				showAlert("Add Patient Provider Attestation Successful");
			} catch (e) {
				showAlert("Error while adding patient provider attestation " + e.message);
			}

		} else {
			// previous attestation, just update
			try {
				update_patient_attestation.run({user_name: appsmith.user.username, patient_id: patient_id, provider_npi: provider_npi, spoke_with: spoke_with, covered_by_government_insurance: covered_by_government_insurance, date_of_attestation: date_of_attestation, provider_type: provider_type, demographic_confirmed: demographic_confirmed, attest_to_not_use_gov_reimbursement: attest_to_not_use_gov_reimbursement});
				get_patient_attestation.run({patient_id: patient_id});
				showAlert("Update Patient Provider Attestation Successful");
				showAlert("Update Patient Provider Attestation Successful");
			} catch (e) {
				showAlert("Error while updating patient provider attestation " + e.message);
			}

		}
	},
	get_card_status: async(patient_id) => {

		// code to get card status from db - which may not be updated -
		if (!patient_id) {
			showAlert("Please select and highlight a patient to change card status");
			return;
		}
		await paysign_get_card_details.run({member_id: patient_lookup_table.triggeredRow["Member ID"]});	
		// await patient_lookup_id_api.run({id: patient_id});
		// const card_data = JSON.parse(patient_lookup_id_api.data?.card_data);
		// const card_data = JSON.parse(paysign_get_card_details.data);
		const card_data = paysign_get_card_details.data;
		// showAlert("card data" + card_data);
		if (!card_data) {
			showAlert("Patient does not have an associated card");
			storeValue("card_status", null)
			return;
		}
		// const card_status = card_data.response?.card_data?.cardStatus;
		const card_status = card_data.card_status;
		showAlert("Current Card Status at Paysign is: " + card_status);
		// storeValue("card_status", card_status); 
		// card_status_sel.selectedOptionValue = 
	},
	update_patient: async (patient_id, member_id, enrollment_status, enrollment_data) => {
		try {
			if (!patient_id || !member_id || !enrollment_status || !enrollment_data || enrollment_data === {}) {
				showAlert("Must have a patient row selected in order to update patient data")
				return
			}
			console.log(enrollment_data)
			const update_patient_result = await update_patient_api.run({"update_payload": {
				"patient_id": patient_id, 
				"member_id": member_id, 
				"enrollment_status": enrollment_status, 
				"enrollment_data": JSON.stringify(enrollment_data)
			}});

			if (update_patient_result?.message === "Patient updated") {
				showAlert("Patient updated successfully, refreshing page view")
				await patient_helper_obj.patient_lookup(patient_lookup_txt.text, patient_lookup_list.selectedOptionValue, "", "")	
			} else {
				showAlert("Unable to update patient at this time")
			}
		} catch (err) {
			console.log(err);
			console.log(err.toString())
			showAlert("Unable to update patient at this time")
		}
	},
	update_patient_member_group: async (patient_id, member_group) => {
		if (!patient_id) {
			showAlert("Please select and highlight patient in patient lookup table first");
		}
		if (!member_group) {
			showAlert("Please select a member group to update to");
		}
		try {
			// showAlert(patient_id + member_group);
			const response = await update_patient_member_grp_api.run({patient_id: patient_id ,member_group: member_group});
			if (response.response_code == 200) {
				showAlert('Patient Member Group Successfully Updated');	
			}	else {
				showAlert("Member Group Update was Not Successful. This is the return response: " + response);
			}		
		} catch (e) {
			// storeValue("message", err.message)
			showAlert(`${update_patient_member_grp_api.data}`);

		}

	},
	link_patient_member_id_to_provider_npi: async(patient_member_id, provider_npi, provider_type) => {
		try {
			provider_type = appsmith.store.provider_type;
			// showAlert(patient_member_id+provider_npi+provider_type)
			if (!patient_member_id) {
				showAlert("Please select and highlight patient in the patient lookup table.")
				return;
			}; 
			if (!provider_npi) {
				showAlert("Please select and highlight provider in the provider search result.")
				return;
			}; 
			if (!provider_type) {
				showAlert("Please select whether provider is primary or secondary." + provider_type)
				return;
			}; 	
			await link_patient_provider_api.run({patient_member_id: patient_member_id, provider_npi: provider_npi, provider_type: provider_type})
			if (!link_patient_provider_api.data) {
				showAlert("Api did not return any result");
			} else {
				showAlert(link_patient_provider_api.data.message);
				// showAlert("Patient - Provider linking Successful for " + patient_member_id + " " + provider_npi);				
			}

		} catch (e) {
			showAlert("Patient - Provider linking failed: "  + e.message);
			return;
		}		
	},	
	link_patient_provider: async (patient_status, member_id, provider_npi, provider_type) => {
		try {
			if (patient_status.toLowerCase() !== "active") return {"message": "Cannot create a link for a patient with Patient Status not Active "}
			else if (!member_id) return {"message": "Appsmith error, unable to link"}
			else if (!provider_npi) return {"message": "Please search and select a provider to link"}
			else if (!provider_type) return {"message": "Please select a Provider Type"}

			const link_patient_provider_response = await link_patient_provider_api.run({"member_id": member_id, "provider_npi": provider_npi, "provider_type": provider_type})
			if (link_patient_provider_response.result === 0) return {"message": `Member ${member_id} linked to provider with NPI ${provider_npi} as ${provider_type}`}

			return {"message": `Failed to link member ${member_id} to provider with NPI ${provider_npi} as ${provider_type}`}
		} catch (err) {
			console.log(err)

			if (link_patient_provider_api.data === "{\"message\":\"Validation error\"}") return {"message": `Link already exists from member ${member_id} to provider with NPI ${provider_npi} as ${provider_type}`}

			return {"message": `Failed to link member ${member_id} to provider with NPI ${provider_npi} as ${provider_type}`}
		}
	},
	get_patient_profile: async (id) => {
		try {
			if (!id)
				return {
					"First Name": "",
					"Last Name": "",
					"Date of Birth": "",
					Address: "",
					Phone: "",
					Email: "",
				};

			const patient_data = await patient_lookup_id_api.run({ id: id });
			const enrollment_data = JSON.parse(patient_data?.enrollment_data || "{}");

			return {
				"First Name": enrollment_data?.first_name || "",
				"Last Name": enrollment_data?.last_name || "",
				"Date of Birth": enrollment_data?.dob || "",
				Address:
				(enrollment_data.address?.address1 || "") +
				(enrollment_data.address?.city ? ` ${enrollment_data.address?.city}` : "") +
				(enrollment_data.address?.state ? ` ${enrollment_data.address?.state}` : "") +
				(enrollment_data.address?.zip_code ? ` ${enrollment_data.address?.zip_code}` : ""),
				Phone: enrollment_data?.phone || "",
				Email: enrollment_data?.email || "",
				Login: patient_data?.credentials_id,
			};
		} catch (err) {
			console.log(err);
			return {
				"First Name": "",
				"Last Name": "",
				"Date of Birth": "",
				Address: "",
				Phone: "",
				Email: "",
			};
		}
	},
	get_patient_caregiver_info: async (id) => {
		try {
			if (!id)
				return {
					"First Name": "",
					"Last Name": "",
					Address: "",
					Phone: "",
				};
			const patient_data = await patient_lookup_id_api.run({ id: id });
			const enrollment_data = JSON.parse(patient_data?.enrollment_data || "{}");
			return {
				"First Name": enrollment_data.lap?.first_name || "",
				"Last Name": enrollment_data.lap?.last_name || "",
				Address:
				(enrollment_data.lap?.address?.address1 || "") +
				(enrollment_data.lap?.address?.city ? ` ${enrollment_data.lap.address.city}` : "") +
				(enrollment_data.lap?.address?.state ? ` ${enrollment_data.lap.address.state}` : "") +
				(enrollment_data.lap?.address?.zip_code ? ` ${enrollment_data.lap.address.zip_code}` : ""),
				Phone: enrollment_data.lap?.phone || "",
			};
		} catch (err) {
			console.log(err);
			return {
				"First Name": "",
				"Last Name": "",
				Address: "",
				Phone: "",
			};
		}
	},
	get_patient_enrollment_details: async (id) => {
		try {
			if (!id)
				return {
					BIN: "",
					PCN: "",
					Group: "",
					"Member ID": "",
					"Max Benefit": "",
					"Benefit Used": "",
					"Available Benefit": "",
				};

			const patient_data = await patient_lookup_id_api.run({ id: id });
			return {
				BIN: "610020",
				PCN: "PDMI",
				Group: "99995209",
				"Member ID": patient_data?.member_id || "",
				"Max Benefit": patient_data?.total_benefits || 15000,
				"Benefit Used":
				patient_data.total_benefits && patient_data.current_year_available ? patient_data.total_benefits - patient_data.current_year_available : "",
				"Available Benefit": patient_data?.current_year_available || "",
			};
		} catch (err) {
			console.log(err);
			return {
				BIN: "",
				PCN: "",
				Group: "",
				"Member ID": "",
				"Max Benefit": "",
				"Benefit Used": "",
				"Available Benefit": "",
			};
		}
	},
	get_patient_communication_details: async (id) => {
		try {
			if (!id) return [];

			const patient_data = await patient_communications_id_api.run({ id: id });
			return patient_data.map((result) => {
				const patient_communication_data = JSON.parse(result?.communication_data || "{}");
				return {
					"Member ID": result?.member_id || "",
					"Document Type": result?.document_type || "",
					"Document Name": patient_communication_data?.file_location?.file_name || "",
					"S3 Bucket": patient_communication_data?.file_location?.s3_bucket || "",
					"S3 Key": `${patient_communication_data?.file_location?.s3_folder || ""}${
					patient_communication_data?.file_location?.file_name || ""
				}`.replace("/LTR/", "/LETTERS/"),
					"Document Received Date": result?.document_received_date || "",
					"Document Sent Date": result?.document_sent_date || "",
					"Document Processed Date": result?.document_processed_date || "",
				};
			});
		} catch (err) {
			console.log(err.toString());
			return [];
		}
	},
	get_patient_claims_details: async (patient_id) => {

		try {
			if (!patient_id) return [];
			await patient_claims_patient_id_api.run({ patient_id: patient_id })
			const patient_data = patient_claims_patient_id_api.data;

			return patient_data.map((result) => {
				const claim_data = JSON.parse(result?.claim_data || "{}");
				const payment_type = result?.payment_type?.toUpperCase() || "#N/A";

				let claim_fill_date = "";
				let date_of_service = "";
				let claim_submission_date = "";
				let claim_payment_date = "";
				let claim_receipt_date = "";

				if (payment_type === "PBM") {
					claim_fill_date = claim_data?.date_filled?.toString() || result?.date_of_service?.toString() || "";
					date_of_service = claim_data?.date_filled?.toString() || result?.date_of_service?.toString() || "";
					claim_submission_date = result?.date_of_service?.toString() || "";
					claim_payment_date = result?.date_of_service?.toString() || "";
					claim_receipt_date = result?.date_of_service?.toString() || "";
				} else if (payment_type === "CHECK" || payment_type === "DEBIT CARD" || payment_type === "EFT" || payment_type === "ACH") {
					claim_fill_date = result?.date_of_service?.toString() || "";
					date_of_service = result?.date_of_service?.toString() || "";
					claim_submission_date = claim_data?.eob_date?.toString() || "";
					claim_payment_date = claim_data?.paid_date?.toString() || "";
					claim_receipt_date = claim_data?.eob_date?.toString() || "";
				}
				const claim_data_without_providers = {};
				for (const [key, value] of Object.entries(claim_data)) {
					if (key === "providers") continue;
					if (!(typeof value === "object" && !Array.isArray(value) && value !== null)) {
						if (key === "date_of_service") {
							claim_data_without_providers[key] = utils.getStandardizedDate(date_of_service);
							continue;
						} else if (key === "date_filled") {
							claim_data_without_providers[key] = utils.getStandardizedDate(claim_fill_date);
							continue;
						} else if (key.includes("date")) {
							claim_data_without_providers[key] = utils.getStandardizedDate(value?.toString() || "");
							continue;
						}
						claim_data_without_providers[key] = value?.toString() ?? "";
					} else {
						claim_data_without_providers[key] = value || {};
					}
				}
				const providers_data = { prescriber: {}, provider: {}, pharmacy: {} };
				for (const [key, value] of Object.entries(claim_data?.providers || {})) {
					providers_data[key] = value;
				}

				return {
					"Claim ID": result?.claim_id ?? "",
					"Patient ID": result?.patient_id ?? "",
					"Provider Name": `${claim_data?.providers?.provider?.payee_info?.first_name || ""} ${claim_data?.providers?.provider?.payee_info?.last_name || ""}`.trim(),
					"Provider ID": result?.provider_id ?? "",
					"Claim Status": result?.claim_status || "",
					"Benefit Amount": claim_data?.program_benefit ?? "",
					"Payment Status": result?.payment_status || "",
					"Payment Type": payment_type,
					"Date of Service": date_of_service,
					"Date Filled": claim_fill_date,
					// "Date Submitted": claim_submission_date,
					"Payment Date": claim_payment_date,
					// "Receipt Date": claim_receipt_date,
					// "PBM BIN": claim_data?.pbm_bin || "",
					// "Claim Authorization": claim_data?.authorization?.claim_authorization || "",
					// "Original Claim Authorization": claim_data?.authorization?.original_claim_authorization || "",
					// "Reversal Claim Authorization": claim_data?.authorization?.reversal_claim_authorization || "",
					claim_data: claim_data_without_providers,
					providers_data: providers_data,
				};
			});
		} catch (err) {
			console.log(err);
			return [];
		}
	}
}