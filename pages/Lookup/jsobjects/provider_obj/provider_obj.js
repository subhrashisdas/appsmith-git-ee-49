export default {
	blank: {
		"provider_npi": "",
		"provider_type": "provider",
		"provider_data": {first_name: "", last_name: "", practice_name: "", phone_number: "", user_agreement: "N", "fax_opt_in": "N", address: {address_1: "", address_2: "", city: "", state: "GA", zip_code: ""}, fax_numbers: {fax_number: "", fax_number_2: ""}, opt_in_fax_numbers: {fax1: "", fax2: "", fax3: ""}},
		"credentials_id": "NULL",
		"preferred_payment_method": "DEBIT",
		"email": null,
	},
	update_fax_opt_in: async(provider_id, fax_opt_in_status, fax_opt_in_1, fax_opt_in_2) => {
		try {

			if (!provider_id) {
				showAlert("Error, not finding provider Database ID to use for update")
			}

			// get provider payload via provider_id
			const provider_payload = await provider_lookup_id_api.run({"provider_id": provider_id})
			const provider_data = JSON.parse(provider_payload.provider_data || "{}")
			const fax_opt_in_before = provider_data.fax_opt_in
			const opt_in_fax_numbers_before = provider_data.opt_in_fax_numbers || null

			provider_data.fax_opt_in = fax_opt_in_status
			if (!provider_data.opt_in_fax_numbers) provider_data.opt_in_fax_numbers = {fax1: "", fax2: "", fax3: ""}
			provider_data.opt_in_fax_numbers.fax1 = fax_opt_in_1?.toString() || ""
			provider_data.opt_in_fax_numbers.fax2 = fax_opt_in_2?.toString() || ""

			const provider_update_payload = {
				provider_id: provider_id,
				npi: provider_payload.provider_npi,
				provider_type: provider_payload.provider_type,
				provider_data: JSON.stringify(provider_data),
				credentials_id: provider_payload.credentials_id || ""
			}

			await provider_update_background_api.run({provider_update_payload: provider_update_payload})
			await log.run({action_type: constants.update_provider_fax_opt_in, ref_id: provider_payload.provider_npi, ref_id_type: constants.npi, change_json: JSON.stringify({"fax_opt_in_before": fax_opt_in_before, "fax_opt_in_after": provider_data.fax_opt_in, "opt_in_fax_numbers_before": opt_in_fax_numbers_before, "opt_in_fax_numbers_after": provider_data.opt_in_fax_numbers}) });
			showAlert(`Provider NPI ${provider_payload.provider_npi} Fax Opt-In info successfully updated, refreshing page view`)
			await closeModal(mdlUpdateFaxOptIn.name)
			await provider_obj.search(provider_lookup_txt.text, provider_lookup_list.selectedOptionValue)					

			return provider_payload
		} catch (e) {
			showAlert("Error encountered + " + JSON.stringify(e))
		}
	},
	update_ach_info: async(provider_id, ach_data) => {
		if (appsmith.user.username != 'bettina.shepard@risrx.com' && appsmith.user.username != 'hao.phan@risrx.com' && appsmith.user.username != 'jefmar.dickens@risrx.com' && appsmith.user.username != 'austin.wagner@risrx.com' && appsmith.user.username != 'daniel.cabrera@risrx.com' && appsmith.user.username !== 'chris.pascual@risrx.com') {
			showAlert("Apologies, your account cannot update ACH info at this time.")
			return
		}

		if (!provider_id) {
			showAlert("Please select and highlight a Provider in the Lookup Table")
			return
		}
		if (!ach_data.bank || !ach_data.routing_number || !ach_data.account_number) {
			showAlert("Bank Name, Routing Number, and Account Number are Required")
			return
		}

		if (ach_data.routing_number.length != 9) {
			showAlert("Routing number must be a 9 characters.")
			return
		}

		if (ach_data.account_number.indexOf("x") > -1 || ach_data.account_number.indexOf("X") > -1) {
			showAlert("Bank Account Number Needs to Be Re-entered with X's removed.")
			return
		}

		let num = Number(ach_data.account_number)
		if (isNaN(num)) {
			showAlert("Bank Account Number Must be Digits Only")
			return
		}

		let route_num = Number(ach_data.routing_number)
		if (isNaN(route_num)) {
			showAlert("Routing Number Must be Digits Only")
			return
		}
		
		// console.log(ach_data)
		storeValue("provider_id", provider_id)
		storeValue("bank", ach_data.bank)
		storeValue("routing_number", ach_data.routing_number)
		storeValue("account_number", ach_data.account_number)
		storeValue("request_date", ach_data.request_date)
		storeValue("account_name", ach_data.account_name)
		storeValue("bank_address", ach_data.bank_address)

		const old_ach = provider_lookup_table.selectedRow["ACH Data"]
		const change_json = {
			"bank": old_ach.bank + " -> " + ach_data.bank,
			"account_name": old_ach.account_name + " -> " + ach_data.account_name,
			"bank_address": old_ach.bank_address + " -> " + ach_data.bank_address,
			"routing_number": old_ach.routing_number + " -> " + ach_data.routing_number,
			"account_number": old_ach.account_number + " -> " + ach_data.account_number,
			"request_date": old_ach.request_date + " -> " + ach_data.request_date
		}
		try {
			await update_provider_ach_api.run()
			showAlert("Update Successful. Please requery provider to see changes")
			await log.run({action_type: constants.update_provider_ach, ref_id: provider_id, ref_id_type: constants.provider_id, change_json: JSON.stringify(change_json) });					
		} catch (e) {
			showAlert("Error updating ACH " + JSON.stringify(e))
		}
		return ach_data
	},
	search_claims: async(provider_id, from_date, to_date, payment_type, program) => {
		if (!provider_id) {
			showAlert("Please select and highlight a Provider in the Lookup Table")
			return
		}
		if (!from_date || !to_date) {
			showAlert("From and To Dates are Required")
			return
		}
		storeValue("provider_id", provider_id)
		storeValue("program", program)
		storeValue("payment_type", payment_type)
		storeValue("from_date", from_date)
		storeValue("to_date", to_date)


		try {

			const claims_data = await get_provider_claims_by_date.run({provider_id: provider_id, program: program, payment_type: payment_type, from_date: from_date, to_date: to_date})
			showAlert(`${claims_data.length} claims found, mapping results`)

			const mapped_provider_lookup_claims = claims_data.map((result) => {
				const claim_data = JSON.parse(result?.claim_data || "{}");
				const payment_type = result?.payment_type?.toUpperCase() || "";

				const date_of_service = utils.getStandardizedDate(result?.date_of_service?.toString()) || "";
				const paid_date = utils.getStandardizedDate(claim_data?.paid_date?.toString()) || "";

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
					"Member ID": claim_data?.member_id ?? "",
					"Patient ID": result?.patient_id ?? "",
					"Patient Name": claim_data?.patient_first_name + " " + claim_data?.patient_last_name ?? "",
					"Provider ID": result?.provider_id ?? "",
					"Program": result?.program || "",
					"Payment Type": payment_type,
					"Claim Status": result?.claim_status || "",
					"Payment Status": result?.payment_status || "",
					"Program Benefit": claim_data?.program_benefit ?? "",
					"Date of Service": date_of_service,
					"Paid Date": paid_date,
					"Check Num": claim_data?.check_num || "",
					claim_data: claim_data_without_providers,
					providers_data: providers_data,
				};
			});

			storeValue("mapped_provider_lookup_claims", mapped_provider_lookup_claims)
			return mapped_provider_lookup_claims
		} catch (err) {
			console.log(err);
			return [];
		}		


	},
	add_new_provider: async (new_provider_payload) => {
		if (!new_provider_payload) {
			showAlert("New Provider Data Form could not be read.  Please refresh and try again.")
			return
		}
		// must have npi with length 10 digits only TODO: add digit only check
		if(!new_provider_payload.provider_npi || new_provider_payload.provider_npi.length != 10) {
			showAlert("Provider NPI is required and must be 10 digits")
		}
		// make sure required fields are not blank
		if (!new_provider_payload.first_name || !new_provider_payload.last_name || !new_provider_payload.practice_name || !new_provider_payload.phone_number || !new_provider_payload.address.address_1 || !new_provider_payload.address.city || !new_provider_payload.address.state || !new_provider_payload.address.zip_code) {
			showAlert("One or more required fields are blank. Please complete and resubmit form data")
			showAlert(new_provider_payload.first_name + new_provider_payload.last_name + new_provider_payload.practice_name + new_provider_payload.phone_number + new_provider_payload.address.address_1 + new_provider_payload.address.city + new_provider_payload.address.state + new_provider_payload.address.zip_code)
			return (new_provider_payload)
		}		
		await add_provider_api.run({new_provider_payload: new_provider_payload})
		showAlert(add_provider_api.data.toString())
	},
	reset_password: async (provider_id, new_password_hash) => {
		try {
			if (!this.is_valid_provider_credentials(new_password_hash)) {
				return
			}

			const provider_user_response = await this.check_provider_has_user(provider_id)
			const provider = await provider_lookup_id_api.run({provider_id: provider_id})

			showAlert(`Resetting password for provider ${provider.provider_npi} to ${new_password_hash}`)

			if (provider_user_response.length > 0) {
				const provider_user = provider_user_response[0]
				await this.update_provider_background(provider, provider_user.login_id)
				const provider_password_reset_api_response = await provider_password_reset_api.run({provider_id: provider_id, new_password_hash: new_password_hash})
				showAlert(provider_password_reset_api_response?.result ? `Provider NPI ${provider.provider_npi} password reset to ${new_password_hash}` : `Failed to reset password for provider NPI ${provider.provider_npi}`)
				await log.run({action_type: constants.provider_pw_reset, ref_id: provider_id, ref_id_type: constants.provider_id, change_json: JSON.stringify(provider_password_reset_api_response) });	
				return
			} else {
				showAlert(`No existing credentials for Provider NPI ${provider.provider_npi}, please create credentials before resetting password`)
				return
			}
		} catch (err) {
			console.log(err)
			showAlert("Failed to reset password")
		}
	},
	create_provider_pw_hash: () => {
		let provider_pw_hash;
		// don't include decimal separation in pw hash
		// will reference triggered row in provider table to create has
		if(!provider_lookup_table.triggeredRow["Provider First Name"] || !provider_lookup_table.triggeredRow["Provider Last Name"]) {
			// either first name or last missing, use practice name
			// showAlert("Creating pw hash using Practice Name");
			provider_pw_hash = provider_lookup_table.triggeredRow["Practice Name"].split(" ").map((s) => s.charAt(0)).join("").toUpperCase() + 
				"" + provider_lookup_table.triggeredRow.Zipcode
		} else { 
			// showAlert("Creating pw hash using Provider First and Last Name");
			provider_pw_hash = provider_lookup_table.triggeredRow["Provider First Name"].split(" ").map(s=>s.charAt(0)).join("").toUpperCase() + 
				"" + provider_lookup_table.triggeredRow["Provider Last Name"].split(" ").map((s) => s.charAt(0)).join("").toUpperCase() + 
				"" + provider_lookup_table.triggeredRow.Zipcode; 
		}
		storeValue('provider_pw_hash', provider_pw_hash);
		return provider_pw_hash;		
	},
	create_provider_user_name: () => {
		let provider_user_name;
		// will reference triggered row in provider table to create has
		if(!provider_lookup_table.triggeredRow["Provider First Name"] || !provider_lookup_table.triggeredRow["Provider Last Name"]) {
			// showAlert("Creating pw hash using Practice Name");
			// either first name or last missing, use practice name
			provider_user_name = provider_lookup_table.triggeredRow["Practice Name"].split(" ").join(".").toLowerCase() + 
				"." + provider_lookup_table.triggeredRow.Zipcode
		} else { 
			// showAlert("Creating pw hash using Provider First and Last Name");
			provider_user_name = provider_lookup_table.triggeredRow["Provider First Name"].split(" ").join(".").toLowerCase() + 
				"." + provider_lookup_table.triggeredRow["Provider Last Name"].split(" ").join(".").toLowerCase() + 
				"." + provider_lookup_table.triggeredRow.Zipcode; 
		}
		storeValue('provider_user_name', provider_user_name);
		return provider_user_name;
	},	
	create_login_credential: async (login_id, new_password_hash, provider_id) => {
		if (!provider_id) {
			showAlert("Please select and highlight a provider.")
			return
		}

		// showAlert("Hao, remember to remove hard coded provider id")
		// provider_id = 25

		// check if provider has existing credentials
		let associated_user = await check_xref_id_exists.run({"xref_id": provider_id})

		if (associated_user && associated_user.length > 0) {
			// user exists 
			associated_user = associated_user[0]
			showAlert("Provider has an existing user with credential id: " + associated_user.login_id + ". Please give to provider to login. If provider has forgotten their password, please use the password reset option and give them the generated password")
			const login_id = associated_user.login_id;

			// update credentials id in provider 
			// update request provider data required so get the original provider data
			let provider_payload = await provider_lookup_id_api.run({provider_id: provider_id})
			const old_provider_data = JSON.parse(JSON.stringify(provider_payload))
			// credential 
			if (provider_payload["credentials_id"] === login_id) return 

			// update the credentials id
			provider_payload["credentials_id"] = login_id

			// api throws error when using provider_npi but accepts npi - so this code remedies that  // ns fixed this so not needed
			const npi = provider_payload["provider_npi"]
			provider_payload["npi"] = npi
			delete provider_payload["provider_npi"]
			const update_provider_payload_api_response = await provider_update_background_api.run({provider_update_payload: provider_payload})
			await log.run({action_type: constants.update_provider_user, ref_id: provider_id, ref_id_type: constants.provider_id, change_json: JSON.stringify({"old": old_provider_data}) });	

			if (update_provider_payload_api_response?.message === "Provider updated") {
				showAlert(`Provider NPI ${provider_payload.provider_npi} successfully updated, refreshing page view`)
				await provider_obj.search(provider_lookup_txt.text, provider_lookup_list.selectedOptionValue)
			} else {
				showAlert("Provider update failed")
			}

			return 
		} else {
			// check if login id has already been used 
			const existing_login = await check_login_id_exists.run({"login_id": login_id})
			if (existing_login && existing_login.length > 0) {
				showAlert("Login is currently associated with a user.")
				return
			}

			// create a user for provider
			const user_type = "provider";
			showAlert("Attempting to create user with login and pw combination: " + login_id + " " +new_password_hash)
			// call api to create login			
			const add_user_api_response = await add_user_api.run({login_id: login_id, password_hash: new_password_hash, user_type: user_type, xref_id: provider_id});

			// update credentials id in provider 
			// update request provider data required so get the original provider data
			let provider_payload = await provider_lookup_id_api.run({provider_id: provider_id})
			// update the credentials id
			provider_payload["credentials_id"] = login_id
			// api throws error when using provider_npi but accepts npi - so this code remedies that  // ns fixed this so not needed // fix needed again
			const npi = provider_payload["provider_npi"]
			provider_payload["npi"] = npi
			delete provider_payload["provider_npi"]
			const update_provider_payload_api_response = await provider_update_background_api.run({provider_update_payload: provider_payload})

			showAlert(add_user_api_response?.message);		
			showAlert(update_provider_payload_api_response?.message)
			await log.run({action_type: constants.add_provider_user, ref_id: provider_id, ref_id_type: constants.provider_id, change_json: JSON.stringify(add_user_api_response) });		
			await log.run({action_type: constants.update_provider_user, ref_id: provider_id, ref_id_type: constants.provider_id, change_json: JSON.stringify(update_provider_payload_api_response) });		

			if (update_provider_payload_api_response?.message === "Provider updated") {
				showAlert(`Provider NPI ${provider_payload.provider_npi} successfully updated, refreshing page view`)
				await provider_obj.search(provider_lookup_txt.text, provider_lookup_list.selectedOptionValue)
			} else {
				showAlert("Provider update failed")
			}

			if (update_provider_payload_api_response?.message !== "Provider updated") {	
				console.log(`Failed to update credentials_id when creating user for provider: ${provider_id}, login id: ${login_id}`)
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
	mappedProviders:(search_results)=>{
			const results = [];

		const provider_type_map = {
			"Billing": "Billing",
			"HCP": "Health Care Provider",
			"Practice": "Practice",
			"SP": "Specialty Pharmacy"
		}
		try{
		search_results.forEach(function (search_result) {
			const provider_data = JSON.parse(search_result?.provider_data || "{}");
			const associated_providers = JSON.parse(search_result?.associated_providers || "{}");
			const opt_in_fax_numbers = provider_data?.opt_in_fax_numbers || {};
			const ach_data = JSON.parse(search_result?.ach_data || "{}")

			results.push({
				"Provider NPI": search_result?.provider_npi || "",
				"Provider First Name": provider_data?.first_name || "",
				"Provider Last Name": provider_data?.last_name || "",
				"Practice Name": provider_data?.practice_name || "",
				"Preferred Payment Method": search_result?.preferred_payment_method || "",
				"Provider Type": provider_type_map[search_result?.provider_type || ""] || search_result?.provider_type || "",
				"Provider Email": search_result?.email || "",
				"Login ID": search_result?.credentials_id || "",
				"Address 1": provider_data?.address?.address_1 || "",
				"Address 2": provider_data?.address?.address_2 || "",
				"City": provider_data?.address?.city || "",
				"State": provider_data?.address?.state || "",
				"Zipcode": provider_data?.address?.zip_code || "",
				"Phone": provider_data?.phone_number || "",
				"Fax-Opt-In": provider_data?.fax_opt_in || "",					
				"Opt-In-Fax Number": provider_data?.opt_in_fax_numbers?.fax1 || provider_data?.opt_in_fax_numbers?.fax2 || provider_data?.opt_in_fax_numbers?.fax || "",
				"User Agreement": provider_data?.user_agreement || "",
				"Database ID": search_result?.provider_id || "",
				// store json data in objects for easy display
				"ACH Data": ach_data,
				"provider_data": provider_data,
				"associated_providers" : associated_providers,  //provider_data?.associated_providers?.provider_ids || "",
				"opt_in_fax_numbers": opt_in_fax_numbers
			});
		});
		}
		catch(e){
			console.log("see ", e.message)
		}
		return results;
		
	},
	search: async (search_text, search_type, clear_store) => {
		// use provider "npi": "1467521799" to find provider with associated provider
		// search_text = "red";
		// search_type = "first_name";
		// search_text = "1467521799";
		// search_type = "npi";
		let search_results = [];
		if (clear_store) await clearStore()
		if (!search_text) {
			showAlert("Please enter input to search");
			search_results = await provider_lookup_api.run({search_text: search_text, search_type: search_type});
				
			const results = this.mappedProviders(search_results);

		  storeValue("mapped_providers", results)
			return;
		}
		if (!search_type) {
			showAlert("Please select a search type to search");
			return;
		}		
		showAlert("Searching Providers");

		if (search_type == 'provider_id') {
			try {			
				await get_provider_by_pid_api.run({provider_id: search_text})
			} catch(e) {
				showAlert("No results found");
				return;				
			}
			search_results.push(get_provider_by_pid_api.data)
			console.log(search_results)
		} else {
			search_results = await provider_lookup_api.run({search_text: search_text, search_type: search_type});
		}
		if (search_results === []) {
			showAlert("No results found");
			return;
		} else {
			showAlert(`${search_results.length} providers found, mapping results`)
		}
		const results = this.mappedProviders(search_results);

		storeValue("mapped_providers", results)
		return results;
	},
	check_provider_has_user: async (provider_id) => {
		try {
			const check_xref_id_exists_response = await check_xref_id_exists.run( {xref_id: provider_id} )
			return check_xref_id_exists_response
		} catch (err) {
			console.log(err)
			return false
		}
	},
	update_provider_background: async (provider, login_id) => {
		const provider_update_payload = {
			provider_id: provider.provider_id,
			npi: provider.provider_npi,
			provider_type: provider.provider_type,
			provider_data: provider.provider_data,
			credentials_id: login_id
		}

		const update_provider_payload_api_response = await provider_update_background_api.run({provider_update_payload: provider_update_payload})
		await log.run({action_type: constants.update_provider_user, ref_id: provider.provider_id, ref_id_type: constants.provider_id, change_json: JSON.stringify(update_provider_payload_api_response) });	
	},
	is_valid_provider_credentials: (new_password_hash) => {
		if (!new_password_hash.match(/^[A-Z]{2}\d{5}$/)) {
			showAlert("Cannot reset password for this provider, invalid First Name, Last Name, or Zipcode: " + new_password_hash)
			return false
		}

		return true
	},
	update_provider: async (provider_id, provider_npi, provider_type, credentials_id, provider_data, provider_update_form_data) => {
		try {
			const provider_type_map = {
				"Billing": "Billing",
				"Health Care Provider": "HCP",
				"Practice": "Practice",
				"Specialty Pharmacy": "SP"
			}
			
			const old_provider_data = await provider_lookup_id_api.run({provider_id: provider_id})

			const update_provider_payload = {
				"provider_id": provider_id,
				"npi": provider_npi,
				"provider_type": provider_type_map[provider_type] || provider_type ,
				"provider_data": JSON.stringify({
					"first_name": provider_update_form_data.first_name_input || "",
					"last_name": provider_update_form_data.last_name_input || "",
					"practice_name": provider_update_form_data.practice_name_input || "",
					"phone_number": provider_update_form_data.phone_input || "",
					"user_agreement": provider_data?.user_agreement || "",
					"fax_opt_in": provider_data?.fax_opt_in || "",
					"address": {
						"address_1": provider_update_form_data.address_1_input || "",
						"address_2": provider_update_form_data.address_2_input || "",
						"city": provider_update_form_data.city_input || "",
						"state": provider_update_form_data.state_input || "",
						"zip_code": provider_update_form_data.zip_code_input ?? "" 
					},
					"fax_numbers": provider_data?.fax_numbers || {
						"fax_number": "",
						"fax_number_2": ""
					},
					"opt_in_fax_numbers": provider_data?.opt_in_fax_numbers || {
						"fax1": "",
						"fax2": "", 
						"fax3": "" 
					}
				}),
				"credentials_id": credentials_id,
				"email": provider_update_form_data.email_input || ""
			}
			if (!provider_update_form_data.email_input) {
				delete update_provider_payload["email"]
			}
			const update_provider_payload_api_response = await update_provider_api.run({provider_payload: update_provider_payload})
			await log.run({action_type: constants.update_provider, ref_id: provider_id, ref_id_type: constants.provider_id, change_json: JSON.stringify({"old": old_provider_data}) });	
			if (update_provider_payload_api_response?.message === "Provider updated") {
				showAlert(`Provider NPI ${provider_npi} successfully updated, refreshing page view`)
				await provider_obj.search(provider_lookup_txt.text, provider_lookup_list.selectedOptionValue)
			} else {
				showAlert("Provider update failed")
			}
		} catch (err) {
			console.log(err)
			console.log(err.toString())
			showAlert("Provider update failed")
		}
	},
	add_provider_user: async (login_id, password_hash, provider_id, npi) => {
		const provider_add_user_api_response = await provider_add_user_api.run({login_id: login_id, password_hash: password_hash, xref_id: provider_id})
		await log.run({action_type: constants.add_provider_user, ref_id: provider_id, ref_id_type: constants.provider_id, change_json: JSON.stringify(provider_add_user_api_response) });						

		return provider_add_user_api_response?.message === "User created"
	},
	create_credentials: async(provider_id, new_password_hash) => {
		try {			
			if (!this.is_valid_provider_credentials(new_password_hash)) {
				return
			}

			const provider_user_response = await this.check_provider_has_user(provider_id)
			const provider = await provider_lookup_id_api.run({provider_id: provider_id})
			showAlert(`Starting credentials creation for Provider NPI ${provider.provider_npi}`)
			let credentials_id = provider.credentials_id
			const is_valid_credentials_id = credentials_id || credentials_id?.toString().toLowerCase() !== "null"

			if (provider_user_response.length > 0) {
				const provider_user = provider_user_response[0]
				await this.update_provider_background(provider, provider_user.login_id)

				if (is_valid_credentials_id) {
					showAlert(`Provider user found with existing Login ID ${provider_user.login_id}`)
				} else {
					showAlert(`Provider user found with existing Login ID ${provider_user.login_id}, Login ID now synced to Provider record. Refreshing page to display updated record`)
					await provider_obj.search(provider_lookup_txt.text, provider_lookup_list.selectedOptionValue)
				}

				return
			} else {
				if (!credentials_id || credentials_id?.toString().toLowerCase() === "null") {
					if (!provider.email.match(/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/)) {
						showAlert("No existing / valid Login ID found, please update the Provider email and try again")	
						return
					} else {
						credentials_id = provider.email
					}
				}

				const validate_user_api_response = await validate_user_api.run({login_id: credentials_id})

				if(validate_user_api_response?.message !== "login valid") {
					showAlert(`Email / Login ID ${credentials_id} already in use, please try another email`)
					return
				}

				const add_provider_user_response = await this.add_provider_user(credentials_id, new_password_hash, provider_id, provider.provider_npi)
				if (add_provider_user_response === true) {
					await this.update_provider_background(provider, credentials_id)
					await provider_obj.search(provider_lookup_txt.text, provider_lookup_list.selectedOptionValue)
					showAlert(`Provider NPI ${provider.provider_npi} credentials created with Login ID ${credentials_id} and password ${new_password_hash}. Refreshing page to display updated record`)
				} else {
					showAlert(`Failed to create credentials for Provider NPI ${provider.provider_npi}`)
				}

				return
			}
		} catch (err) {
			console.log(err)
			showAlert("Failed to create credentials")
		}	
	},
	get_associated_providers: async (provider_id, associated_providers_obj) => {
		// use provider "npi": "1467521799" to find provider with associated provider
		try {
			if (!provider_id) return [];

			const associated_provider_ids = associated_providers_obj?.provider_ids || [];
			const provider_type_map = {
				"Billing": "Billing",
				"HCP": "Health Care Provider",
				"Practice": "Practice",
				"SP": "Specialty Pharmacy"
			}

			const associated_provider_results = await Promise.all(
				associated_provider_ids.map(async (associated_provider_id) => {
					try {
						const search_result = await provider_lookup_id_param_api.run({ provider_id: associated_provider_id });

						const provider_data = JSON.parse(search_result?.provider_data || "{}");
						const associated_providers = JSON.parse(search_result?.associated_providers || "{}");
						const opt_in_fax_numbers = provider_data?.opt_in_fax_numbers || {};
						const ach_data = JSON.parse(search_result?.ach_data || "{}")

						return {
							"Provider NPI": search_result?.provider_npi || "",
							"Provider First Name": provider_data?.first_name || "",
							"Provider Last Name": provider_data?.last_name || "",
							"Practice Name": provider_data?.practice_name || "",
							"Preferred Payment Method": search_result?.preferred_payment_method || "",
							"Provider Type": provider_type_map[search_result?.provider_type || ""] || "",
							"Provider Email": search_result?.email || "",
							"Login ID": search_result?.credentials_id || "",
							"Address 1": provider_data?.address?.address_1 || "",
							"Address 2": provider_data?.address?.address_2 || "",
							"City": provider_data?.address?.city || "",
							"State": provider_data?.address?.state || "",
							"Zipcode": provider_data?.address?.zip_code || "",
							"Phone": provider_data?.phone_number || "",
							"Fax-Opt-In": provider_data?.fax_opt_in || "",					
							"Opt-In-Fax Number": provider_data?.opt_in_fax_numbers?.fax1 || provider_data?.opt_in_fax_numbers?.fax2 || provider_data?.opt_in_fax_numbers?.fax || "",
							"User Agreement": provider_data?.user_agreement || "",
							"Database ID": search_result?.provider_id || "",
							// store json data in objects for easy display
							"ACH Data": ach_data,
							"provider_data": provider_data,
							"associated_providers" : associated_providers,  //provider_data?.associated_providers?.provider_ids || "",
							"opt_in_fax_numbers": opt_in_fax_numbers
						};
					} catch (err) {
						console.log(err);
						return null;
					}
				})
			);

			const associated_providers = associated_provider_results.filter((associated_provider_result) => {
				return associated_provider_result !== null;
			});

			storeValue("mapped_associated_providers", associated_providers)
		} catch (err) {
			(err.message);
			console.log(err);
			storeValue("mapped_associated_providers", [])
		}
	},
}