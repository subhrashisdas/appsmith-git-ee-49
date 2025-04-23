export default {

	sample_provider: {
    "provider_id": 16784,
    "provider_npi": "1821223348",
    "provider_type": "Billing",
    "provider_data": "{\"first_name\": \"Redding\", \"last_name\": \"Allergy\", \"practice_name\": \"Redding Allergy And Asthma Center, Inc.\", \"phone_number\": \"4043550078\", \"user_agreement\": \"Y\", \"fax_opt_in\": \"Y\", \"address\": {\"address_1\": \"3193 HoWELL MILL RD NW\", \"address_2\": \"SUITE 102\", \"city\": \"ATLANTA\", \"state\": \"GA\", \"zip_code\": \"30327\"}, \"fax_numbers\": {\"fax_number\": \"4043550079\", \"fax_number_2\": \"4043550079\"}, \"opt_in_fax_numbers\": {\"fax1\": \"4043550079\", \"fax2\": \"NULL\", \"fax3\": \"NULL\"}}",
    "credentials_id": "NULL",
    "preferred_payment_method": "ACH",
    "associated_providers": null,
    "email": null,
    "ach_data": "{\"account_name\": \"Redding Allergy and Asthma Center\", \"bank\": \"Bank of America\", \"bank_address\": \"1280 West Paces Ferry Road NW, Atlanta, GA, 30327\", \"routing_number\": \"61000052\", \"account_number\": \"334026489\", \"request_date\": \"2023-01-01\"}",
    "last_name_v": "Allergy",
    "practice_name_v": "Redding Allergy And Asthma Center, Inc.",
    "state_v": "GA",
    "city_v": "ATLANTA",
    "zip_code_v": "30327",
    "first_name_v": null },
	add_provider: async () => {
			showAlert("Feature is awaiting testing before deployment");
			const provider_add_form_data = null // provider_add_form.formData

			if (!provider_add_form_data["Email"] && (!provider_add_form_data["Provider First Name"] || !provider_add_form_data["Provider Last Name"] || !provider_add_form_data["Zipcode"])) {
				// throw new Error("No valid login_id configuration")
				showAlert("Provider email, first name, last name, and zip code required");
				return
			}
			const provider_type = provider_add_form_data["Provider Type"];
			const first_name = provider_add_form_data["Provider First Name"];
			const last_name = provider_add_form_data["Provider Last Name"];
		  const practice_name = provider_add_form_data["Practice Name"];
			const phone_number = provider_add_form_data["Phone"];
			const fax = provider_add_form_data["Fax"];
		  const address_1 = provider_add_form_data["Address 1"];
		  const address_2 = provider_add_form_data["Address 2"];
			const city = provider_add_form_data["City"];
			const state = provider_add_form_data["State"];
		  const zip_code = provider_add_form_data["Zipcode"];
			const email = provider_add_form_data["Email"]
			const provider_npi = provider_add_form_data["NPI"];
			const preferred_payment_method = provider_add_form_data["Preferred Payment Method"] || "";		
		
			const provider_data = JSON.stringify({
				first_name: first_name,
				last_name: last_name,
				practice_name: practice_name,
				phone_number: phone_number,
				user_agreement: "N",
				fax_opt_in: "N",
				address: {
					address_1: address_1,
					address_2: address_2,
					city: city,
					state: state,
					zip_code: zip_code,
				},
				fax_numbers: {
					fax_number: fax,
					fax_number_2: ""
				},
				opt_in_fax_numbers: {
					fax1: "",
					fax2: "", 
					fax3: "0000000"
				}
			});
			showAlert(provider_data);
// "preferred_payment_method": "DEBIT",			
			const full_name_and_zip = provider_add_form_data["Provider First Name"] + " " + provider_add_form_data["Provider Last Name"] + " " + provider_add_form_data["Zipcode"].slice(0,5);
			showAlert(full_name_and_zip);
			const credentials_id = full_name_and_zip.split(" ").join("."); // replace space with dot
			showAlert(credentials_id);

			// provider_add_form_data["Email"] || `${provider_add_form_data["Provider First Name"]}.${provider_add_form_data["Provider Last Name"]}.${provider_add_form_data["Zipcode"]}`  DC's credential code

			const provider_add_response = await provider_add_api.run({
				provider_npi: provider_npi,
				provider_type: provider_type, // "provider_type": "Billing",
				provider_data: provider_data,
				credentials_id: credentials_id,
			  preferred_payment_method: preferred_payment_method,
				email: email,				
			});
		
			// const provider_add_response = await provider_add_api.run({
				// provider_npi: provider_npi,
				// provider_type: provider_type, // "provider_type": "Billing",
				// provider_data: provider_data,
				// credentials_id: credentials_id,
			  // preferred_payment_method: preferred_payment_method,
				// "associated_providers": null,
				// email: email,				
				// last_name_v: last_name,
				// practice_name_v: practice_name,
				// state_v: state,
				// city_v: city,
				// zip_code_v: zip_code,
				// first_name_v: first_name, 
			// });
			const provider_add_response_data = provider_add_response.json();
			console.log(provider_add_response_data);	
			showAlert(provider_add_response_data.toString());
			// if (!provider_add_response_data) {
				// // check if above is adequate to check for failure
				// showAlert(appsmith.store.provider_add_response?.message || "Failed to add provider");							
			// }
			// const full_name = provider_add_form_data["Provider First Name"] + " " + provider_add_form_data["Provider Last Name"];
			// let full_name_initials = full_name.split(" ").map(s => s.charAt(0));
			// full_name_initials.push(provider_add_form_data["Zipcode"].slice(0,5)); # add zip to initials
			// const provider_password_hash =  full_name_initials.join(".") //`${provider_add_form_data["Provider First Name"].charAt(0).toUpperCase()}${provider_add_form_data["Provider Last Name"].charAt(0).toUpperCase()}${provider_add_form_data["Zipcode"]}`
			// 
			// const provider_add_user_response = await add_user_api.run({
				// login_id: provider_add_response_data.credentials_id,
				// password_hash: provider_password_hash,
				// user_type: "provider",
				// xref_id: provider_id
			// })
// 
 // 
			// showAlert(provider_add_user_response
			// // return {message: `Provider created with login id ${provider_add_response_data.credentials_id} and password ${provider_password_hash}`}
		// // } catch (err) {
			// // console.log(err)
// 
			// if (err.message === "No valid login_id configuration") return {message: "Provider must have an Email or complete First Name, Last Name, and Zipcode"}
			// else if (err.message === "provider_add_api failed to execute") {
				// try {
					// const provider_add_api_data_json = JSON.parse(provider_add_api.data);
					// return {message: provider_add_api_data_json?.message || "Failed to add provider"}
				// } catch (e) {
					// showAlert(e.toString());
				// }
			// }
			// else if (err.message === "provider_add_user_api failed to execute") {
				// try {
					// const provider_add_user_api_data_json = JSON.parse(provider_add_user_api.data);
					// 
					// return {message: provider_add_user_api_data_json.message !== undefined ? `${provider_add_user_api_data_json.message} - Failed to create provider login credentials` : "Failed to create provider login credentials"}
				// } catch (e) {
				// }
			// }
// 
			// return {message: "Failed to add provider"}
		// }
	// 
		
	},
}