export default {
	member_ids_to_link: [''],
	xolair_dev_url: "http://xolair-api.netswitchcard.com",
	xolair_prod_url: "https://web-xolair-api.netswitchcard.com",
	async link_patients_to_provider(patients, provider_type, provider_id, npi) {
		// links all patients to provider
		if (!patients || !provider_type || !provider_id || !npi) {
			showAlert("Patient Member IDs, Provider ID, and Provider NPI are all required")
			return
		}

		let i = 0
		// (member_ids[i], link_to_npi, link_to_provider_id)
		let successful_links = []
		let successful_links_count = 0
		let failed_links = []
		let failed_links_count = 0
		let existing_links = []
		let existing_links_count = 0
		let member_ids_not_found = []
		let member_ids_not_found_count = 0

		storeValue('npi', npi)
		storeValue('provider_id', provider_id)
		const member_ids = patients.split(',')

		const limit = 5000
		for (let i = 0; i < Math.min(member_ids.length, limit); i++) {
			let member_id = member_ids[i].trim()
			console.log("processing member id # " + i.toString() + " " + member_id)

			showAlert("processing member id # " + i.toString() + " " + member_id)
			console.log("processing member id:  " + member_id)			
			if (member_id.slice(0,2).toUpperCase() == 'XR') {
				// showAlert("XR number found - need to convert to RIS ID")
				storeValue("xr_number", member_id)
				await get_member_id_from_xr.run()
				if (!get_member_id_from_xr.data || get_member_id_from_xr.data.length == 0) {
					// showAlert("XR not found: " + member_id)
					member_ids_not_found.push(member_id)
					member_ids_not_found_count++
					continue
				} else {
					// replace old xr with current member id
					member_id = get_member_id_from_xr.data[0].member_id
					// showAlert("XR found associated with RIS ID: " + member_id)
				}
			} 

			// check if provider npi exists 		
			try {
				storeValue("npi", npi)
				const get_provider_by_npi_resp = await get_provider_by_npi.run()
				// return get_provider_by_npi_resp 
				} catch(e) {
					// showAlert("Could not find provider by npi " + JSON.stringify(e))
					return (JSON.stringify(e))
				}


			storeValue("member_id", member_id)
			// check if member id exists 		
			try {
				const get_patient_by_member_id_result = await get_patient_by_member_id.run({member_id: member_id})
				// return get_patient_by_member_id_result 
				} catch(e) {
					// showAlert("Could not find member id " + JSON.stringify(e))
					member_ids_not_found.push(member_id)
					member_ids_not_found_count++
					console.log(JSON.stringify(e))
					continue

				}

			// check if currently linked

			try {
				storeValue('provider_id', provider_id)
				// const get_patients_linked_to_prov_id_res = await get_patients_linked_to_prov_id.run()
				const get_patients_linked_to_prov_id_res = await get_patients_of_provider.run()
				let already_linked = false
				// console.log(get_patients_linked_to_prov_id_res.length)
				for (let i=0; i < get_patients_linked_to_prov_id_res.length; i++) {
					let p = get_patients_linked_to_prov_id_res[i]
					// console.log(p)
					if (p.member_id === member_id) {
						already_linked = true
						existing_links.push(p.member_id + "->" + npi)
						existing_links_count++
						continue
					}
				}
				if(already_linked) {
					continue
				}
			} catch(e) {
				// showAlert("Error while finding patients linked to provider - ok to keep going?")
				showAlert("patient link to provider function " + JSON.stringify(e))
			}

			// link patient to provider
			// let provider_type = "Primary"  // or "Primary"

			try {
				storeValue("provider_type", provider_type)
				const link_patient_to_provider_res = await link_patient_to_provider.run({member_id: member_id, npi: npi, provider_type: provider_type})
				successful_links.push(member_id + "->" + npi)
				successful_links_count++
				// console.log(link_patient_to_provider_res) 
				// return link_patient_to_provider_res;

			} catch(e) {
				// showAlert("Error while link patients provider - keep a log?")
				// showAlert(JSON.stringify(e))
				failed_links.push(member_id + "->" + npi )
				failed_links_count++
			}

		}

		// console.log(successful_links)
		// console.log(failed_links)
		const linking_results = {
			"successes": successful_links || [],
			"fails": failed_links || [],
			"existings": existing_links || [],
			"member_ids_not_found": member_ids_not_found || []
		}

		console.log(linking_results)
		await log.run({action_type: constants.link_patient_to_provider, ref_id: "MULTIPLE RIS ID", ref_id_type: constants.member_id, change_json: JSON.stringify(linking_results) });		
		linking_results["successes"] = linking_results["successes"].join(",  ")
		linking_results["fails"] = linking_results["fails"].join(",  ")
		linking_results["existings"] = linking_results["existings"].join(",  ")
		linking_results["member_ids_not_found"] = linking_results["member_ids_not_found"].join(",  ")
		storeValue("linking_results", linking_results)
		storeValue("successful_links_count", successful_links_count)
		storeValue("failed_links_count", failed_links_count)
		storeValue("existing_links_count", existing_links_count)
		storeValue("member_ids_not_found_count", member_ids_not_found_count)
		return linking_results

	},
	async link_patient_to_provider (member_ids, link_to_npi, link_to_provider_id) {
		// link /patientproviders/assign
		let i = 0
		// (member_ids[i], link_to_npi, link_to_provider_id)
		let successful_links = []
		let failed_links = []
		let existing_links = []
		let member_ids_not_found = []

		// create list of patient member ids
		member_ids = this.member_ids_to_link
		// assign provider npi to variable for linking

		// **** REMEMBER TO UPDATE PROVIDER ID WITH NPI !!!!!!!
		const npi = '1811035652'
		storeValue('npi', npi)

		// assign provider id to variable for finding already linked patients
		const provider_id = '6001'
		storeValue('provider_id', provider_id)
		const limit = 1000
		for (let i = 0; i < Math.min(this.member_ids_to_link.length, limit); i++) {
			console.log("processing member id # " + i.toString())
			// check if provider npi exists 		
			try {
				storeValue("npi", npi)
				const get_provider_by_npi_resp = await get_provider_by_npi.run()
				// return get_provider_by_npi_resp 
				} catch(e) {
					// showAlert("Could not find provider by npi " + JSON.stringify(e))
					return (JSON.stringify(e))
				}

			let member_id = member_ids[i] 
			storeValue("member_id", member_id)
			// check if member id exists 		
			try {
				const get_patient_by_member_id_result = await get_patient_by_member_id.run({member_id: member_id})
				// return get_patient_by_member_id_result 
				} catch(e) {
					// showAlert("Could not find member id " + JSON.stringify(e))
					member_ids_not_found.push(member_id)
					console.log(JSON.stringify(e))
					continue

				}

			// check if currently linked

			try {
				storeValue('provider_id', provider_id)
				const get_patients_linked_to_prov_id_res = await get_patients_linked_to_prov_id.run()
				let already_linked = false
				// console.log(get_patients_linked_to_prov_id_res.length)
				for (let i=0; i < get_patients_linked_to_prov_id_res.length; i++) {
					let p = get_patients_linked_to_prov_id_res[i]
					// console.log(p)
					if (p.member_id === member_id) {
						already_linked = true
						existing_links.push(p.member_id + "->" + member_id)
						continue
					}
				}
				if(already_linked) {
					continue
				}
			} catch(e) {
				// showAlert("Error while finding patients linked to provider - ok to keep going?")
				showAlert("patient link to provider function " + JSON.stringify(e))
			}

			// link patient to provider
			let provider_type = "Primary"  // or "Primary"

			try {
				storeValue("provider_type", provider_type)
				const link_patient_to_provider_res = await link_patient_to_provider.run({member_id: member_id, npi: npi, provider_type: provider_type})
				successful_links.push(member_id + "->" + npi)
				// console.log(link_patient_to_provider_res) 
				// return link_patient_to_provider_res;

			} catch(e) {
				// showAlert("Error while link patients provider - keep a log?")
				// showAlert(JSON.stringify(e))
				failed_links.push(member_id + "->" + npi )
			}

		}
		// console.log(successful_links)
		// console.log(failed_links)
		const linking_results = {
			"successes": successful_links || [],
			"fails": failed_links || [],
			"existings": existing_links || [],
			"member_ids_not_found": member_ids_not_found || []
		}
		console.log(linking_results)
		await log.run({action_type: constants.link_patient_to_provider, ref_id: "MULTIPLE RIS ID", ref_id_type: constants.member_id, change_json: JSON.stringify(linking_results) });		
		return linking_results
	}
}