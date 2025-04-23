export default {
	provider_lookup: async () => {
		try {
			// const lookup_params = (provider_lookup_nppes_form?.formData?.npi || "") !== "" ? {
			// npi: provider_lookup_nppes_form.formData.npi,
			// first_name: "",
			// last_name: "",
			// state: "",
			// } : {
			// npi: "",
			// first_name: provider_lookup_nppes_form?.formData?.first_name || "",
			// last_name: provider_lookup_nppes_form?.formData?.last_name || "",
			// state: provider_lookup_nppes_form?.formData?.state || "",
			// }
			// 
			// const provider_lookup_results = (await provider_lookup_nppes_api.run(lookup_params))?.results || []
			// 
			// return provider_lookup_results.map((provider) => {
			// return {
			// "NPI": provider?.number || "",
			// "Provider First Name": provider?.basic?.first_name || provider?.basic?.authorized_official_first_name || "",
			// "Provider Last Name": provider?.basic?.last_name || provider?.basic?.authorized_official_last_name || "",
			// "Practice Name": provider?.basic?.organization_name || "",
			// "Address 1": provider?.addresses?.[0]?.address_1 || "",
			// "Address 2": provider?.addresses?.[0]?.address_2 || "",
			// "City": provider?.addresses?.[0]?.city || "",
			// "State": provider?.addresses?.[0]?.state || "",
			// "Zipcode": provider?.addresses?.[0]?.postal_code.toString().slice(0,5) || "",
			// "Phone": provider?.addresses?.[0]?.telephone_number || "",
			// "Fax": provider?.addresses?.[0]?.fax_number || ""
			// }
			// })
			return []
		} catch (err) {
			console.log(err.toString())
			return []
		}
	},
	add_provider: async (provider_add_form_data) => {
		try {
			const provider = await this.check_provider_npi_exists(provider_add_form_data.npi_input)
			
			if (provider !== false) {
				showAlert(`Provider NPI ${provider_add_form_data.npi_input} already exists. If the provider cannot log in to the portal, please create credentials for them from the lookup page or reset their password`)
				return
				// const provider_user_response = await this.check_provider_has_user(provider.provider_id)
				//
				// if (provider_user_response.length > 0) {
					// const provider_user = provider_user_response[0]
					// await this.update_provider(provider, provider_user.login_id)
					// showAlert(`Provider already exists with NPI ${provider_add_form_data.npi_input} with Login ID ${provider_user.login_id}`)
					// return
				// } else {
					// const provider_password_hash = "Wp5*aX4#nK@!"
					// await this.add_provider_user(provider_add_form_data.email_input, provider_password_hash, provider.provider_id, provider_add_form_data.npi_input)
					// return
				// }
			}

			const validate_user_api_response = await validate_user_api.run({login_id: provider_add_form_data.email_input})
			if(validate_user_api_response?.message !== "login valid") {
				showAlert(`Email / Login ID ${provider_add_form_data.email_input} already in use, please try another email`)
				return
			}

			const new_provider_payload = {
				"provider_npi": provider_add_form_data.npi_input ?? "",
				"provider_type": provider_add_form_data.provider_type_input || "",
				"provider_data": JSON.stringify({
					"first_name": provider_add_form_data.first_name_input || "",
					"last_name": provider_add_form_data.last_name_input || "",
					"practice_name": provider_add_form_data.practice_name_input || "",
					"phone_number": provider_add_form_data.phone_input || "",
					"user_agreement": "",
					"fax_opt_in": "",
					"address": { "address_1": provider_add_form_data.address_1_input || "", "address_2": provider_add_form_data.address_2_input || "", "city": provider_add_form_data.city_input || "", "state": provider_add_form_data.state_input || "", "zip_code": provider_add_form_data.zip_code_input ?? "" },
					"fax_numbers": { "fax_number": "", "fax_number_2": "" },
					"opt_in_fax_numbers": { "fax1": "", "fax2": "", "fax3": "" }
				}),
				"credentials_id": provider_add_form_data.email_input || "",
				"preferred_payment_method": provider_add_form_data.pref_pay_method_input || "",
				"associated_providers": null,
				"email": provider_add_form_data.email_input || ""
			}
			const provider_add_response = await provider_add_api.run({"new_provider_payload": new_provider_payload})

			const provider_password_hash = "Wp5*aX4#nK@!"
			await this.add_provider_user(provider_add_response.credentials_id, provider_password_hash, provider_add_response.provider_id, provider_add_response.provider_npi)
			await log.run({action_type: constants.add_provider , ref_id: provider_add_form_data.npi_input, ref_id_type: constants.npi, change_json: JSON.stringify(new_provider_payload) });		
		} catch (err) {
			console.log(err)
			console.log(err.toString())
			showAlert("Failed to add provider")
		}
	},
	check_provider_npi_exists: async (npi) => {
		try {
			const get_provider_by_npi_api_response = await get_provider_by_npi_api.run( {npi: npi} )
			return get_provider_by_npi_api_response
		} catch (err) {
			console.log(err)
			return false
		}
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
	add_provider_user: async (login_id, password_hash, provider_id, npi) => {
		const provider_add_user_api_response = await provider_add_user_api.run({login_id: login_id, password_hash:password_hash, xref_id: provider_id})

		if (provider_add_user_api_response?.message === "User created") {
			showAlert(`Provider NPI ${npi} added with login id ${login_id} and password ${password_hash}`)

			await log.run({action_type: constants.add_provider_user, ref_id: npi, ref_id_type: constants.npi, change_json: JSON.stringify(provider_add_user_api_response) });	
		} else {
			showAlert(`Provider NPI ${npi} added, but failed to create provider login credentials`)
		}
	},
	update_provider: async (provider, login_id) => {
		const provider_update_payload = {
			provider_id: provider.provider_id,
			npi: provider.provider_npi,
			provider_type: provider.provider_type,
			provider_data: provider.provider_data,
			credentials_id: login_id
		}

		await provider_update_api.run({provider_update_payload: provider_update_payload})
		await log.run({action_type: constants.update_provider , ref_id: provider.provider_npi, ref_id_type: constants.npi, change_json: JSON.stringify(provider_update_payload) });		
	}
}