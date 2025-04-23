export default {
	update_patient_member_group: async (patient_id, member_id, member_group) => {
		if (!patient_id || !member_id) {
			showAlert("Please select and highlight patient in patient lookup table first as patient and Member ID are required from the highlighted record.");
		}
		if (!member_group) {
			showAlert("Please select a member group to update to");
		}
		try {			
			await update_patient_member_grp_ps.run({member_id: member_id ,member_group: member_group});
			showAlert('Patient Member Group Successfully Updated at Paysign')
			let maximizer_patient
			if (member_group.includes('A') || member_group.includes('a')) {
				maximizer_patient = 0 // maximizer
			} else {
				maximizer_patient = 1 // non maximizer
			}
			try {
				await update_copay_maximizer_status.run({patient_id: patient_id, maximizer_patient: maximizer_patient})
				showAlert('Successfully set Maximizer Patient in Main Database to ' + maximizer_patient.toString());	
				// log both responses
				await log.run({action_type: constants.update_patient_member_group + " " + member_group, ref_id: member_id, ref_id_type: constants.member_id, change_json: "Paysign response " + JSON.stringify(update_patient_member_grp_ps.data) + " Main DB response " + JSON.stringify(update_copay_maximizer_status.data)})			
				return // prevent double logging
			} catch(e) {
				showAlert("Failed to set Maximizer Patient in Main Database to " + maximizer_patient.toString())
			}
			// log only paysign response
			await log.run({action_type: constants.update_patient_member_group + " " + member_group, ref_id: member_id, ref_id_type: constants.member_id, change_json: JSON.stringify(update_patient_member_grp_ps.data) })			

		} catch (e) {
			// storeValue("message", err.message)
			showAlert(`Member Group Update was Not Successful. This is the return response:  ${update_patient_member_grp_ps.data}`);

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
			const patient_provider_data = JSON.parse(search_result?.patient_provider_data || "{}");
			const provider_data = JSON.parse(search_result?.provider_data || "{}");
			const lap = enrollment_data?.lap || "{}";
			const commercial_insurance = enrollment_data?.commercial_insurance || "{}";
			const benefits_amounts = JSON.parse(search_result?.benefits_amounts || "{}");
			const card_data = JSON.parse(search_result?.card_data || "{}");
			const verification_data = JSON.parse(search_result?.verification_data || "{}");

			return {
				"Member ID": search_result?.member_id || "",
				"First Name": enrollment_data?.first_name || "",
				"Last Name": enrollment_data?.last_name || "",
				"Date of Birth": enrollment_data?.date_of_birth || "",
				"Enrollment Status": search_result?.enrollment_status ||"",
				"Prior Member ID": search_result?.prior_member_id || "",
				"Gender": enrollment_data?.gender || "",
				"Drug Patient": search_result?.drug_patient || "",
				"Drug Admin Patient": search_result?.drug_admin_patient || "",
				"Original Enrollment Date Drug": search_result?.original_enrollment_date_drug || "",
				"Original Enrollment Date Drug Admin": search_result?.original_enrollment_date_drug_admin || "",
				"Current Enrollment Date Drug": search_result?.current_enrollment_date_drug || "",
				"Current Enrollment Date Drug Admin": search_result?.current_enrollment_date_drug_admin || "",
				"Enrollment Source": search_result?.enrollment_source || "",
				"Address": `${enrollment_data?.address?.address_1 || ""}${enrollment_data?.address?.address_2 || ""}`.trim(),
				"City": enrollment_data?.address?.city || "",
				"State": enrollment_data?.address?.state|| "",
				"Zipcode": enrollment_data?.address?.zip_code || enrollment_data?.address["Zip Code"] || search_result.zip_code_v || "",
				"Phone": enrollment_data?.phone || lap?.phone || enrollment_data?.phone_number || lap?.phone_number || "",
				"Email": enrollment_data?.email || lap?.email || "",
				"Database ID": search_result?.patient_id || "",
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
		try {
			// clear store to free up memory
			await clearStore()

			// search text and option value blank so validate for searching by enrollment date
			if (!inputText && !selectedOptionValue) {
				// validate date fields for enrollment search
				if (!start_date && !end_date) {
					showAlert("Please enter a start and end date range.")
					return [];
				};
				if (!start_date) {
					showAlert("Please enter a start date.")
					return [];
				};
				if (!end_date) {
					showAlert("Please enter an end date.")
					return [];
				};
			};
			// start and end dates blank so validate regular lookup
			if (!start_date && !end_date)	{
				if (!inputText) {
					// validate fields for input text search 
					showAlert("Please enter text value to search.");
					return [];		
				}
			};

			let search_results = [];

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
				if (selectedOptionValue === "member_id") {
					try {
						const res = await get_patient_by_member_id.run({member_id: inputText});
						search_results.push(res);
					} catch (err) {
						showAlert("No patients found")
						return
					}
				} else if (selectedOptionValue == "patient_id") {
					search_results = await get_patient_by_patient_id.run({patient_id: inputText})
				} else {
					if (selectedOptionValue === "dob") {
						inputText = this.convertDOB(inputText);
					}
					search_results = await patient_search_api.run( {selected_option_value: selectedOptionValue, input_text: inputText});	
					if (search_results.length === 0) { showAlert("No patients found"); return; }
				}

			}

			showAlert(`${search_results.length} patients found, mapping results`)

			const mapped_patients = this.map_patient(search_results);
			storeValue("mapped_import_patients", mapped_patients);
			return mapped_patients;
		} catch (e) {
			showAlert(e.message);
			return [];
		}
	},

	convertDOB: (dob) => {
		const newDOB = new Date(dob);
		try {
			if (newDOB.getTime() <= new Date().getTime()) {
				return newDOB.toISOString().split("T")[0];
			} else {
				return new Date(newDOB.setFullYear(newDOB.getFullYear() - 100)).toISOString().split("T")[0];
			}
		} catch (e) {
			return dob;
		}
	},
	
	get_patient_claims_details: async (patient_id) => {
		try {
			if (!patient_id) return [];
			const patient_data = await patient_claims_patient_id_api.run({ patient_id: patient_id })
			showAlert(`${patient_data.length} claims found, mapping results`)

			const mapped_patient_lookup_claims = patient_data.map((result) => {
				const claim_data = JSON.parse(result?.claim_data || "{}");
				const payment_type = result?.payment_type?.toUpperCase() || "";

				const date_of_service = utils.getStandardizedDate(result?.date_of_service?.toString()) || "";
				const paid_date = payment_type == 'PBM' ? date_of_service : utils.getStandardizedDate(claim_data?.paid_date?.toString()) ||"";

				const claim_data_without_providers = {};
				for (let [key, value] of Object.entries(claim_data)) {
					if (key === "providers") continue;
					else if (key === "patient_data") continue;
					else if (key === "provider_data") continue;
					else if (key === "check_response") continue;
					else if (key === "paysign_api_data") continue;

					if (!(typeof value === "object" && !Array.isArray(value) && value !== null)) {
						value = value?.toString() ?? ""

						if (key === "date_of_service") {
							claim_data_without_providers[key] = date_of_service;
						} else if (key === "paid_date") {
							claim_data_without_providers[key] = paid_date;
						} else if (key.includes("date")) {
							claim_data_without_providers[key] = utils.getStandardizedDate(value?.toString() || "");
						} else {
							try {
								claim_data_without_providers[key] = JSON.parse(value);	
							} catch (err) {
								claim_data_without_providers[key] = value
							}
						}
					} else {
						claim_data_without_providers[key] = value || {};
					}
				}

				const providers_data = { prescriber: {}, provider: {}, pharmacy: {} };
				for (const [key, value] of Object.entries(claim_data?.providers || {})) {
					if (!(typeof value === "object" && !Array.isArray(value) && value !== null)) {
						providers_data[key] = value ?? ""
					} else {
						providers_data[key] = value ?? {}
					}
				}

				return {
					"Claim ID": result?.claim_id ?? "",
					"Patient ID": result?.patient_id ?? "",
					"Provider ID": result?.provider_id ?? "",
					"Program": result?.program || "",
					"Payment Type": payment_type,
					"Claim Status": result?.claim_status || "",
					"Payment Status": result?.payment_status || "",
					"Check Num": claim_data?.check_num,
					"Program Benefit": claim_data?.program_benefit ?? claim_data?.benefit_amount ?? "",
					"Date of Service": date_of_service,
					"Paid Date": paid_date,
					claim_data: claim_data_without_providers,
					providers_data: providers_data,
				};
			});

			storeValue("mapped_patient_lookup_claims", mapped_patient_lookup_claims)
			return mapped_patient_lookup_claims
		} catch (err) {
			console.log(err);
			return [];
		}
	}
}