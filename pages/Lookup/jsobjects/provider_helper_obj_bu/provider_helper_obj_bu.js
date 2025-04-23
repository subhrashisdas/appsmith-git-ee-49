export default {
	put_users_of_provider_in_store: async (xref_id) => {
		// functionality part of provider user reset if able to reset by associated user id
		showAlert("start with xref_id " + xref_id);
		let users_of_provider = [];
		if (appsmith.store.users_of_provider.length == 0) {
			// get users and only keep login_id for comparison
			await get_users_list_api.run();
			let users_list = get_users_list_api.data; 
			users_list.forEach((d) => d.xref_id == xref_id ? users_of_provider.push(d): showAlert(d.xref_id));
			// store in memory to prevent refetch if login id already exists
			storeValue("users_of_provider", users_of_provider);
		} else {
			// already in memory, 
			
		}				

	},
	create_provider_user: async (login_id, password_hash, user_type, xref_id) => {
		// currently, no api to allow changing password associated with specific user
		let users = Set();
		if (!appsmith.store.users_set) {
			// get users and only keep login_id for comparison
			await get_users_list_api.run();
			let users_list = get_users_list_api.data; 
			users_list.forEach((d) => users.add(d.login_id));
			// store in memory to prevent refetch if login id already exists
			storeValue("users_set", users);
		} else {
			// already in memory, j
			users = appsmith.store.users_set;
		}				
		if (users.has(login_id)) {
			showAlert("Login ID is already in use, please pick another");
			return
		} else {
			try {
				add_user_api.run({login_id: login_id, password_hash: password_hash, user_type: user_type, xref_id: xref_id});
				showAlert("User added successfully: " + JSON.stringify(add_user_api.data));
				// clear store so that data doesn't become stale
				clearStore();
			} catch (e) {
				showAlert("Error while adding user " + e.toString());
			}
		}
	},
	parse_provider_search_results: (search_results) =>{
		const results = [];
		search_results.forEach(function (search_result) {
			const provider_data = JSON.parse(search_result?.provider_data || "");
			const associated_providers = JSON.parse(search_result?.associated_providers || "{}");
			const opt_in_fax_numbers = provider_data?.opt_in_fax_numbers || {};
			// storeValue("provider_data", provider_data);
			// storeValue("associated_providers", associated_providers);
			// storeValue("opt_in_fax_numbers", opt_in_fax_numbers);

			results.push({
				"Database ID": search_result?.id || "",
				"Provider ID": search_result?.provider_id || "",
				"Provider NPI": search_result?.provider_npi || "",
				"Credentials ID": search_result?.credentials_id || "",
				"Preferred Payment Method": search_result?.preferred_payment_method || "",
				"Provider Email": search_result?.email || "",
				"ACH Data": search_result?.ach_data || "",
				"User Agreement": provider_data?.user_agreement || "",					

				"Provider First Name": provider_data?.first_name || "",
				"Provider Last Name": provider_data?.last_name || "",
				"Practice Name": provider_data?.practice_name || "",
				"Address 1": provider_data?.address?.address_1 || "",
				"Address 2": provider_data?.address?.address_2 || "",
				"City": provider_data?.address?.city || "",
				"State": provider_data?.address?.state || "",
				"Zipcode": provider_data?.address?.zip_code || "",
				"Phone": provider_data?.phone_number || "",
				"Fax": provider_data?.fax_numbers?.fax_number || provider_data?.fax_numbers?.fax_number_2 ||  "",
				"Fax-Opt-In": provider_data?.fax_opt_in || "",					
				"Opt-In-Fax Number": provider_data?.opt_in_fax_numbers?.fax1 || provider_data?.opt_in_fax_numbers?.fax2 || provider_data?.opt_in_fax_numbers?.fax || "",
				// store json data in objects for easy display
				"provider_data": provider_data,
				"associated_providers" : associated_providers,  //provider_data?.associated_providers?.provider_ids || "",
				"opt_in_fax_numbers": opt_in_fax_numbers,
			});
		});

		return results;		
	},
	search: async (search_text, search_type) => {
		// use provider "npi": "1467521799" to find provider with associated provider
		// search_text = "red";
		// search_type = "first_name";
		// search_text = "1467521799";
		// search_type = "npi";
		if (!search_text) {
			showAlert("Please enter input to search");
			return;
		}
		if (!search_type) {
			showAlert("Please select a search type to search");
			return;
		}		
		showAlert("Searching Providers");
		const search_results = await provider_lookup_api.run({search_text: search_text, search_type: search_type});
		if (!search_results) {
			showAlert("No results returned: " + JSON.stringify(provider_lookup_api.responseMeta));
			return;
		}
		const results = [];
		showAlert("Parsing Provider Data");
		search_results.forEach(function (search_result) {
			const provider_data = JSON.parse(search_result?.provider_data || "");
			const associated_providers = JSON.parse(search_result?.associated_providers || "{}");
			const opt_in_fax_numbers = provider_data?.opt_in_fax_numbers || {};
			// storeValue("provider_data", provider_data);
			// storeValue("associated_providers", associated_providers);
			// storeValue("opt_in_fax_numbers", opt_in_fax_numbers);

			results.push({
				"Database ID": search_result?.id || "",
				"Provider ID": search_result?.provider_id || "",
				"Provider NPI": search_result?.provider_npi || "",
				"Credentials ID": search_result?.credentials_id || "",
				"Preferred Payment Method": search_result?.preferred_payment_method || "",
				"Provider Email": search_result?.email || "",
				"ACH Data": search_result?.ach_data || "",
				"User Agreement": provider_data?.user_agreement || "",					

				"Provider First Name": provider_data?.first_name || "",
				"Provider Last Name": provider_data?.last_name || "",
				"Practice Name": provider_data?.practice_name || "",
				"Address 1": provider_data?.address?.address_1 || "",
				"Address 2": provider_data?.address?.address_2 || "",
				"City": provider_data?.address?.city || "",
				"State": provider_data?.address?.state || "",
				"Zipcode": provider_data?.address?.zip_code || "",
				"Phone": provider_data?.phone_number || "",
				"Fax": provider_data?.fax_numbers?.fax_number || provider_data?.fax_numbers?.fax_number_2 ||  "",
				"Fax-Opt-In": provider_data?.fax_opt_in || "",					
				"Opt-In-Fax Number": provider_data?.opt_in_fax_numbers?.fax1 || provider_data?.opt_in_fax_numbers?.fax2 || provider_data?.opt_in_fax_numbers?.fax || "",
				// store json data in objects for easy display
				"provider_data": provider_data,
				"associated_providers" : associated_providers,  //provider_data?.associated_providers?.provider_ids || "",
				"opt_in_fax_numbers": opt_in_fax_numbers,
			});
		});
		storeValue("mapped_providers", results)
		return results;
	},
	get_associated_providers: async (provider_id) => {
		// use provider "npi": "1467521799" to find provider with associated provider
		try {
			if (!provider_id) return [];
			const provider_obj = appsmith.store.provider_obj; //await provider_lookup_id_param_api.run({ provider_id: provider_id });
			// showAlert("provider data " + provider_obj.associated_providers.provider_ids);
			const associated_providers = provider_obj.associated_providers;
			// showAlert("associated providers " + associated_providers);
			// const associated_providers = JSON.parse(provider_obj?.associated_providers || "{}");
			const associated_provider_ids = associated_providers?.provider_ids || [];

			const associated_provider_results = await Promise.all(
				associated_provider_ids.map(async (associated_provider_id) => {
					try {
						const associated_provider_data = await provider_lookup_id_param_api.run({ provider_id: associated_provider_id });
						const associated_provider_data_json = JSON.parse(associated_provider_data?.provider_data || "{}");

						return {
							ID: associated_provider_data?.provider_id || "",
							NPI: associated_provider_data?.provider_npi || "",
							"Provider First Name": associated_provider_data_json?.first_name || "",
							"Provider Last Name": associated_provider_data_json?.last_name || "",
							"Practice Name": associated_provider_data_json?.practice_name || "",
							"Address 1": associated_provider_data_json?.address?.address_1 || "",
							"Address 2": associated_provider_data_json?.address?.address_2 || "",
							City: associated_provider_data_json?.address?.city || "",
							State: associated_provider_data_json?.address?.state || "",
							Zipcode: associated_provider_data_json?.address?.zip_code || "",
							Phone: associated_provider_data_json?.phone_number || "",
							Fax: associated_provider_data_json?.fax_numbers?.fax_number || associated_provider_data_json?.fax_numbers?.fax_number_2 || "",
						};
					} catch (err) {
						console.log(err);
						return null;
					}
				})
			);

			console.log(associated_provider_results);

			return associated_provider_results.filter((associated_provider_result) => {
				return associated_provider_result !== null;
			});
		} catch (err) {
			(err.message);
			console.log(err);
			return [];
		}
	},
	get_patients_of_provider: async (provider_id) => {
		try {

			if (!provider_id) return [];
			// provider_patients_lookup_api doesn't work properly - Barnabas asked us to use provider_patients_lookup_api but pass in no associated providers
			// const associated_patients = await provider_patients_lookup_api.run({ provider_id: provider_id });
			const search_results = await patients_of_providers_api.run({ provider_id: provider_id, associated_provider_ids: {} });
			if (!search_results) {
				showAlert("No Associated Patients Found for Provider");
				return;
			}
			const associated_patients_results = await Promise.all(
				search_results.map(async (associated_patient) => {
					try {
						const enrollment_data = JSON.parse(associated_patient?.enrollment_data || "{}");
						const patient_provider_data = JSON.parse(associated_patient?.patient_provider_data || "{}");
						const provider_data = JSON.parse(associated_patient?.provider_data || "{}");
						return search_results.map(function (search_result) {
							const enrollment_data = JSON.parse(search_result?.enrollment_data || "{}");
							const patient_provider_data = JSON.parse(search_result?.patient_provider_data || "{}");
							const provider_data = JSON.parse(search_result?.provider_data || "{}");
							const lap= enrollment_data?.lap;
							const commercial_insurance = enrollment_data?.commercial_insurance || "{}";
							const benefits_amounts = search_result?.benefits_amounts || "{}";

							const card_data = JSON.parse(search_result?.card_data || "{}");
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
								"Phone": lap?.phone_number || "",
								"Address":
								(enrollment_data.address?.address1 || "") +
								(enrollment_data.address?.city ? ` ${enrollment_data.address?.city}` : "") +
								(enrollment_data.address?.state ? ` ${enrollment_data.address?.state}` : "") +
								(enrollment_data.address?.zip_code ? ` ${enrollment_data.address?.zip_code}` : ""),
								"Zipcode": enrollment_data?.address?.zip_code || "",
								"Email": enrollment_data?.email || "",
								"Primary Provider NPI": provider_data?.primary?.npi || "",
								"Primary Provider Name": `${patient_provider_data?.first_name || ""} ${patient_provider_data?.fast_name || ""}`.trim(),
								"Verification Data": enrollment_data?.verification_data || "",
								"Credentials Data": enrollment_data?.credentials_id || "",
								// "Patient Data": enrollment_data?.patient_data || "",
								"Card Pii": enrollment_data?.card_pii || "",
								"Eligibility Data": enrollment_data?.eligibility_data || "",
								"patient_enrollment": enrollment_data,
								"patient_lap": lap,				
								"patient_provider_data": patient_provider_data,
								"patient_commercial_insurance": commercial_insurance,
								"patient_benefits_amounts": benefits_amounts,		
								"card_data": card_data
							};
						});		
						// return {
						// "Patient Status": associated_patient?.enrollment_status || "",
						// "Previous Member ID": associated_patient?.prior_member_id || "",
						// "Current Member ID": associated_patient?.member_id || "",
						// "Enrollment Date": associated_patient?.enrollment_date || "",
						// "First Name": enrollment_data?.first_name || "",
						// "Last Name": enrollment_data?.last_name || "",
						// "Date of Birth": enrollment_data?.dob || "",
						// Gender: enrollment_data?.gender || "",
						// Phone: enrollment_data?.phone || "",
						// Zipcode: enrollment_data?.address?.zip_code || "",
						// "Primary Provider NPI": provider_data?.primary?.npi || "",
						// "Primary Provider Name": `${patient_provider_data?.first_name || ""} ${patient_provider_data?.fast_name || ""}`.trim(),
						// "Total Benefit": associated_patient?.total_benefits !== undefined ? associated_patient.total_benefits : "",
						// "Current Balance": associated_patient?.current_year_available !== undefined ? associated_patient.current_year_available : "",
						// "Database ID": associated_patient?.patient_id || "",
						// };
					} catch (err) {
						console.log(err);
						return null;
					}
				})
			);

			console.log(associated_patients_results);

			return associated_patients_results.filter((associated_patient_result) => {
				return associated_patient_result !== null;
			});
		} catch (err) {
			console.log(err);
			return [];
		}
	},
	get_provider_patient_claims_details: async (provider_id, patient_id) => {
		try {
			const provider_patient_claims = await provider_patient_claims_id_api.run({
				provider_id: provider_id,
				patient_id: patient_id,
			});

			return provider_patient_claims.map((result) => {
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
				} else if (payment_type === "CHECK" || payment_type === "DEBIT") {
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
							claim_data_without_providers[key] = utils.getStandardizedDate(value || "");
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
					"Provider Name": `${claim_data?.providers?.provider?.first_name || ""} ${claim_data?.providers?.provider?.last_name || ""}`.trim(),
					"Provider ID": result?.provider_id ?? "",
					"Claim Status": result?.claim_status || "",
					"Benefit Amount": claim_data?.benefit_amount ?? "",
					"Payment Status": result?.payment_status || "",
					"Payment Type": payment_type,
					"Date of Service": date_of_service,
					"Date Filled": claim_fill_date,
					"Date Submitted": claim_submission_date,
					"Payment Date": claim_payment_date,
					"Receipt Date": claim_receipt_date,
					"PBM BIN": claim_data?.pbm_bin || "",
					"Claim Authorization": claim_data?.authorization?.claim_authorization || "",
					"Original Claim Authorization": claim_data?.authorization?.original_claim_authorization || "",
					"Reversal Claim Authorization": claim_data?.authorization?.reversal_claim_authorization || "",
					claim_data: claim_data_without_providers,
					providers_data: providers_data,
				};
			});
		} catch (err) {
			console.log(err.toString());
			return [];
		}
	},
	// get_patients_of_parent_and_associated_providers: async (parent_provider_id, list_of_associated_provider_ids) => {
	// await patients_of_providers_api.run({provider_id: parent_provider_id, associated_provider_ids: list_of_associated_provider_ids});
	// if (!patients_of_providers_api.data) return [];
	// return patients_of_providers_api.data;
	// 
	// },
	update_provider: async () => {
		try {
			const provider_data = await provider_lookup_id_api.run();
			const provider_data_json = JSON.parse(provider_data?.provider_data || "{}");
			console.log(provider_data);
			provider_data_json.first_name = provider_lookup_table.updatedRow["Provider First Name"];
			provider_data_json.last_name = provider_lookup_table.updatedRow["Provider Last Name"];
			provider_data_json.practice_name = provider_lookup_table.updatedRow["Practice Name"];
			if (!provider_data_json.address) provider_data_json.address = {};
			provider_data_json.address.address1 = provider_lookup_table.updatedRow["Address 1"];
			provider_data_json.address.address2 = provider_lookup_table.updatedRow["Address 2"];
			provider_data_json.address.city = provider_lookup_table.updatedRow.City;
			provider_data_json.address.state = provider_lookup_table.updatedRow.State;
			provider_data_json.address.zip_code = provider_lookup_table.updatedRow.Zipcode;
			if (!provider_data_json.phones) provider_data_json.phones = {};
			provider_data_json.phones.phone = provider_lookup_table.updatedRow.Phone;
			provider_data_json.phones.fax = provider_lookup_table.updatedRow.Fax;
			if (!provider_data_json.fax_opt_in) provider_data_json.fax_opt_in = {};
			provider_data_json.fax_opt_in.fax1 = provider_lookup_table.updatedRow.Fax;
			provider_data.provider_data = JSON.stringify(provider_data_json);
			return {
				url: "c",
				body: provider_data
			};
		} catch (err) {
			console.log(err);
		}
	},
	create_provider_pw_hash: () => {
		let provider_pw_hash;
		// will reference triggered row in provider table to create has
		if(!provider_lookup_table.triggeredRow["Provider First Name"] || !provider_lookup_table.triggeredRow["Provider Last Name"]) {
			// either first name or last missing, use practice name
			showAlert("Creating pw hash using Practice Name");
			provider_pw_hash = provider_lookup_table.triggeredRow["Practice Name"].split(" ").forEach((s) => s.charAt(0)).join(".").toLowerCase() + 
			"." + provider_lookup_table.triggeredRow.Zipcode
		} else { 
			showAlert("Creating pw hash using Provider First and Last Name");
		 provider_pw_hash = provider_lookup_table.triggeredRow["Provider First Name"].split(" ").forEach(s=>s.charAt(0)).join(".").toLowerCase() + 
			"." + provider_lookup_table.triggeredRow["Provider Last Name"].split(" ").forEach((s) => s.charAt(0)).join(".").toLowerCase() + 
			"." + provider_lookup_table.triggeredRow.Zipcode; 
		}
		storeValue('provider_pw_hash', provider_pw_hash);
		return provider_pw_hash;		
	},
	create_provider_user_name: () => {
		let provider_user_name;
		// will reference triggered row in provider table to create has
		if(!provider_lookup_table.triggeredRow["Provider First Name"] || !provider_lookup_table.triggeredRow["Provider Last Name"]) {
			showAlert("Creating pw hash using Practice Name");
			// either first name or last missing, use practice name
			provider_user_name = provider_lookup_table.triggeredRow["Practice Name"].split(" ").join(".").toLowerCase() + 
			"." + provider_lookup_table.triggeredRow.Zipcode
		} else { 
			showAlert("Creating pw hash using Provider First and Last Name");
			provider_user_name = provider_lookup_table.triggeredRow["Provider First Name"].split(" ").join(".").toLowerCase() + 
			"." + provider_lookup_table.triggeredRow["Provider Last Name"].split(" ").join(".").toLowerCase() + 
			"." + provider_lookup_table.triggeredRow.Zipcode; 
		}
		storeValue('provider_user_name', provider_user_name);
		return provider_user_name;
	},
	reset_password: async () => {

			// check if provider has credentials and prompt user to add user
			if (provider_lookup_table.triggeredRow["Credentials ID"].toUpperCase() == "NULL" || !provider_lookup_table.triggeredRow["Credentials ID"]) {
				showAlert("Provider does not have credentials currently. Please select Add User to create login id and password.")
				return;
			}
			
			
			if (!provider_lookup_table.triggeredRow["Provider First Name"] || !provider_lookup_table.triggeredRow["Provider Last Name"] || !provider_lookup_table.triggeredRow["Zipcode"]) {
					if (!provider_lookup_table.triggeredRow["Practice Name"]) {
						showAlert("Provider login cannot be created because a first and last name or practice name is required along with the zip code");
						return;
					}
			}
		// create provider pw from triggered row
		// const provider_user_name = this.create_provider_user_name
		const new_password_hash = this.create_provider_pw_hash;
		try {
			await provider_password_reset_api.run({
				provider_id: provider_lookup_table.triggeredRow["Provider ID"],
				npi: provider_lookup_table.triggeredRow["NPI"],
				new_password_hash: new_password_hash
			})

			return {message: `Password successfully reset to ${new_password_hash}`}
		} catch (err) {
			console.log(err.toString())
			if (err.message === "Invalid default password configuration") return {message: "Failed to update password, provider must have a First Name, Last Name, and Zipcode"}
			return {message: "Failed to update password"}
		}

	}	
}