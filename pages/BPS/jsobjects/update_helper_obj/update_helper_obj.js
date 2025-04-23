export default {
	patients: ['1147185820'],
	ps_maximizer_group_number: '100073A',
	async mass_segment_using_claims_analysis (patients) {

		// patients = this.patients
		// const member_ids = patients
		// maximizer_group_number = this.ps_maximizer_group_number

		if (!patients) {
			showAlert("Patient IDs required")
			return
		}

		// (member_ids[i], link_to_npi, link_to_provider_id)
		let y_n = []
		let y_n_count = 0
		let n_y = []
		let n_y_count = 0
		let n_n = []
		let n_n_count = 0
		let n_u = []
		let n_u_count = 0
		let na_na = []
		let na_na_count = 0		
		let failed = []
		let failed_count = 0
		let patient_ids_not_found = []
		let patient_ids_not_found_count = 0

		const patient_ids = patients.split(',')

		const limit = 1000 //5000000
		if (patient_ids.length > limit) {
			showAlert("Limit set at 1,000 -> only the first 1,000 will be processed. Please process the next 1,000 batch separately.")
		}
		for (let i = 0; i < Math.min(patient_ids.length, limit); i++) {
			let patient_id = patient_ids[i].trim()

			console.log("processing patient id # " + (i+1).toString() + " of " + patient_ids.length + " " + patient_id.toString())
			showAlert("processing patient id # " + (i+1).toString() + " of " + patient_ids.length + " " + patient_id.toString())


			// check if member id exists 		
			try {
				const patient_found = await get_patient_bps_by_patient_id.run({patient_id: patient_id})
				// return get_patient_by_member_id_result
				if (patient_found.length === 0) {
					patient_ids_not_found.push(patient_id)
					patient_ids_not_found_count++
					continue						
				}								
			} catch(e) {
				// showAlert("Could not find member id " + JSON.stringify(e))
				patient_ids_not_found.push(patient_id)
				patient_ids_not_found_count++
				continue
			}

			let at_risk_for_mp_aap
			// Auto-segment
			try {
				// auto_segment_via_claims_api: async (patient_id, is_new, refresh_lookup_table)
				at_risk_for_mp_aap = await bps_helper_obj.auto_segment_via_claims_api(patient_id, false, false)
			} catch (e) {
				failed.push(patient_id)
				failed_count++
				continue
			}
			console.log("at_risk_for_mp_aap returned value " + at_risk_for_mp_aap)
			// showAlert("at_risk_for_mp_aap returned value " + at_risk_for_mp_aap)			
			if (!at_risk_for_mp_aap) {
				failed.push(patient_id)
				failed_count++
			} else if (at_risk_for_mp_aap == constants.at_risk_for_mp_aap_mapping["Y|N"]) {
				y_n.push(patient_id)
				y_n_count++					
			} else if (at_risk_for_mp_aap == constants.at_risk_for_mp_aap_mapping["N|Y"]) {
				n_y.push(patient_id)
				n_y_count++						
			} else if (at_risk_for_mp_aap == constants.at_risk_for_mp_aap_mapping["N|N"]) {
				n_n.push(patient_id)
				n_n_count++
			} else if (at_risk_for_mp_aap == constants.at_risk_for_mp_aap_mapping["N|U"]) {
				n_u.push(patient_id)
				n_u_count++
			} else if (at_risk_for_mp_aap == constants.at_risk_for_mp_aap_mapping["NA|NA"]) {					
				na_na.push(patient_id)
				na_na_count++				
			} else {
				failed.push(patient_id)
				failed_count++			
			}
		}
		// console.log(successful_updates)
		// console.log(failed_updates)
		const auto_segment_results = {
			"y_n": y_n || [],
			"n_y": n_y || [],
			"n_n": n_n || [],
			"n_u": n_u || [],
			"na_na": na_na || [],
			"failed": failed || [],
			"patient_ids_not_found": patient_ids_not_found || []
		}

		console.log(auto_segment_results)
		await log.run({action_type: constants.auto_segmentation_claims_api, ref_id: "MULTIPLE PATIENT ID", ref_id_type: constants.patient_id, change_json: JSON.stringify(auto_segment_results) });		
		auto_segment_results["y_n"] = auto_segment_results["y_n"].join(",  ")
		auto_segment_results["n_y"] = auto_segment_results["n_y"].join(",  ")
		auto_segment_results["n_n"] = auto_segment_results["n_n"].join(",  ")
		auto_segment_results["n_u"] = auto_segment_results["n_u"].join(",  ")
		auto_segment_results["na_na"] = auto_segment_results["na_na"].join(",  ")
		auto_segment_results["failed"] = auto_segment_results["failed"].join(",  ")
		auto_segment_results["patient_ids_not_found"] = auto_segment_results["patient_ids_not_found"].join(",  ")
		storeValue("auto_segment_results", auto_segment_results)
		storeValue("y_n_count", y_n_count)
		storeValue("n_y_count", n_y_count)
		storeValue("n_n_count", n_n_count)
		storeValue("n_u_count", n_u_count)
		storeValue("na_na_count", na_na_count)
		storeValue("failed_count", failed_count)
		storeValue("patient_ids_not_found_count", patient_ids_not_found_count)		
		return auto_segment_results

	},	
	async batch_update_ps_maximizer(patients, maximizer_group_number) {
		const patient_mids = patients.split(',')

		const batch_size = 1000;
		for (let i = 0; i < patient_mids.length; i += batch_size) {
			const member_ids = patient_mids.slice(i, i + batch_size);
			showAlert("batch from " + i.toString() + " to " + (i+batch_size).toString())
			showAlert(member_ids.toString())
			await this.mass_update_ps_maximizer (member_ids, maximizer_group_number)
		}
	},
	async mass_update_ps_maximizer (patients, maximizer_group_number) {

		// patients = this.patients
		// const member_ids = patients
		// maximizer_group_number = this.ps_maximizer_group_number

		if (!patients || !maximizer_group_number) {
			showAlert("Patient Member IDs and maximizer group are both required")
			return
		}

		// (member_ids[i], link_to_npi, link_to_provider_id)
		let successful_updates = []
		let successful_updates_count = 0
		let failed_updates = []
		let failed_updates_count = 0
		let existing_updates = []
		let existing_updates_count = 0
		let member_ids_not_found = []
		let member_ids_not_found_count = 0

		const member_ids = patients.split(',')

		const limit = 1000 //5000000
		if (member_ids.length > limit) {
			showAlert("Limit set at 1,000 -> only the first 1,000 will be processed. Please process the next 1,000 batch separately.")
		}
		for (let i = 0; i < Math.min(member_ids.length, limit); i++) {
			let member_id = member_ids[i].trim()

			console.log("processing member id # " + (i+1).toString() + " of " + member_ids.length + " " +member_id)
			showAlert("processing member id # " + (i+1).toString() + " of " + member_ids.length + " " +member_id)

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


			storeValue("member_id", member_id)
			// check if member id exists 		
			try {
				const get_patient_by_member_id_result = await get_copay_patient_by_mid.run({member_id: member_id})
				// return get_patient_by_member_id_result
				if (get_patient_by_member_id_result.length === 0) {
					member_ids_not_found.push(member_id)
					member_ids_not_found_count++
					continue						
				}								
			} catch(e) {
				// showAlert("Could not find member id " + JSON.stringify(e))
				member_ids_not_found.push(member_id)
				member_ids_not_found_count++
				console.log(JSON.stringify(e))
				continue

			}

			// no way to check if already maximizer at the moment


			// set as maximizer at paysign
			try {
				// update maximizer status at ps 
				await update_patient_member_grp_ps.run({member_group: maximizer_group_number, member_id: member_id})
				showAlert("Successfully updated Paysign Member Group to Maximizer")
				successful_updates.push(member_id + "->" + maximizer_group_number)
				successful_updates_count++					
			} catch (e) {

				console.log(update_patient_member_grp_ps.data)
				const message = update_patient_member_grp_ps.data?.message || ""
				if (message == 'No subgroup change detected.') {
					showAlert(member_id + " No change in member group detected.  Patient already in Paysign member Group " + maximizer_group_number)
					existing_updates.push(member_id + "->" + maximizer_group_number)
					existing_updates_count++					
				} else {
					showAlert("Failed to update Paysign member Group")
					failed_updates.push(member_id + "->" + maximizer_group_number )
					failed_updates_count++
				}
			}

		}

		// console.log(successful_updates)
		// console.log(failed_updates)
		const update_maximizer_results = {
			"successes": successful_updates || [],
			"fails": failed_updates || [],
			"existings": existing_updates || [],
			"member_ids_not_found": member_ids_not_found || []
		}

		console.log(update_maximizer_results)
		await log.run({action_type: constants.add_bps_maximizer_patient, ref_id: "MULTIPLE RIS ID", ref_id_type: constants.member_id, change_json: JSON.stringify(update_maximizer_results) });		
		update_maximizer_results["successes"] = update_maximizer_results["successes"].join(",  ")
		update_maximizer_results["fails"] = update_maximizer_results["fails"].join(",  ")
		update_maximizer_results["existings"] = update_maximizer_results["existings"].join(",  ")
		update_maximizer_results["member_ids_not_found"] = update_maximizer_results["member_ids_not_found"].join(",  ")
		storeValue("ps_update_maximizer_results", update_maximizer_results)
		storeValue("successful_updates_count", successful_updates_count)
		storeValue("failed_updates_count", failed_updates_count)
		storeValue("existing_updates_count", existing_updates_count)
		storeValue("member_ids_not_found_count", member_ids_not_found_count)
		return update_maximizer_results

	},
	async mass_update_db_maximizer (patients, maximizer_status_code) {
		// patients = this.patients 
		// maximizer_status_code = 0 

		let maximizer_status_code_str
		try {
			maximizer_status_code_str = maximizer_status_code.toString()
		} catch(e) {
			showAlert("Maximizer Status Code Required")
			return	
		}

		if (!patients || maximizer_status_code.toString().length == 0) {
			showAlert("Patient Member IDs and maximizer status code are both required")
			return
		}

		// (member_ids[i], link_to_npi, link_to_provider_id)
		let successful_updates = []
		let successful_updates_count = 0
		let failed_updates = []
		let failed_updates_count = 0
		let existing_updates = []
		let existing_updates_count = 0
		let member_ids_not_found = []
		let member_ids_not_found_count = 0

		const member_ids = patients.split(',')

		const limit = 1000

		if (member_ids.length > limit) {
			showAlert("Limit set at 1,000 -> only the first 1,000 will be processed. Please process the next 1,000 batch separately.")
		}

		for (let i = 0; i < Math.min(member_ids.length, limit); i++) {
			let member_id = member_ids[i].trim()
			console.log("processing member id # " + (i+1).toString() + " of " + member_ids.length + " " +member_id)

			showAlert("processing member id # " + (i+1).toString() + " of " + member_ids.length + " " +member_id)

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


			storeValue("member_id", member_id)
			// check if member id exists 		
			try {
				await get_copay_patient_by_mid.run({member_id: member_id})
				// return get_patient_by_member_id_result


				// check if already maximizer
				try {
					// const get_patients_linked_to_prov_id_res = await get_patients_linked_to_prov_id.run()
					const get_copay_patient_by_mid_data = await get_copay_patient_by_mid.data
					let already_maximizer = false  // should rename to already_status
					// console.log(get_patients_linked_to_prov_id_res.length)
					for (let i=0; i < get_copay_patient_by_mid_data.length; i++) {
						let p = get_copay_patient_by_mid_data[i]
						// let enrollment_data = p?.enrollment_data
						let enrollment_data_json = JSON.parse(p?.enrollment_data || "{}")
						// console.log("patient data" + p)
						// console.log("enrollment_data " + enrollment_data)
						// console.log("enrollment_data_json " + enrollment_data_json)
						// console.log("enrollment_data_json.maximizer " + enrollment_data_json["maximizer"])						
						if (enrollment_data_json["maximizer"] === parseInt(maximizer_status_code)) {
							already_maximizer = true
							existing_updates.push(p.member_id + "->" + maximizer_status_code.toString())
							existing_updates_count++
							continue
						}
					}
					if(already_maximizer) {
						showAlert("Patient already marked in Main Database as " + maximizer_status_code.toString())
						continue
					}
				} catch(e) {
					// showAlert("Error while finding patients linked to provider - ok to keep going?")
					showAlert("Error while checking if patient is maximizer " + JSON.stringify(e))
				}						
			} catch(e) {
				// showAlert("Could not find member id " + JSON.stringify(e))
				member_ids_not_found.push(member_id)
				member_ids_not_found_count++
				console.log(JSON.stringify(e))
				continue

			}

			// continue // stop here for testing

			// set as maximizer
			try {

				await get_patient_id_from_member_id.run({member_id: member_id})
				const patient_id = parseInt(get_patient_id_from_member_id.data[0].patient_id)
				console.log("patient_id " + patient_id.toString())
				const update_copay_maximizer_status_res = await update_copay_maximizer_status.run({"patient_id": patient_id, "maximizer_patient": parseInt(maximizer_status_code)})
				showAlert("Successfully updated Main Database Maximizer Status to " + maximizer_status_code.toString())
				successful_updates.push(member_id + "->" + maximizer_status_code.toString())
				successful_updates_count++
			} catch (e) {
				showAlert("Failed to update Main Database Maximizer Status")					
				failed_updates.push(member_id + "->" + maximizer_status_code.toString() )
				failed_updates_count++
			}


		}

		// console.log(successful_updates)
		// console.log(failed_updates)
		const update_maximizer_results = {
			"successes": successful_updates || [],
			"fails": failed_updates || [],
			"existings": existing_updates || [],
			"member_ids_not_found": member_ids_not_found || []
		}

		console.log(update_maximizer_results)
		await log.run({action_type: constants.add_bps_maximizer_patient, ref_id: "MULTIPLE RIS ID", ref_id_type: constants.member_id, change_json: JSON.stringify(update_maximizer_results) });		
		update_maximizer_results["successes"] = update_maximizer_results["successes"].join(",  ")
		update_maximizer_results["fails"] = update_maximizer_results["fails"].join(",  ")
		update_maximizer_results["existings"] = update_maximizer_results["existings"].join(",  ")
		update_maximizer_results["member_ids_not_found"] = update_maximizer_results["member_ids_not_found"].join(",  ")
		storeValue("update_maximizer_results", update_maximizer_results)
		storeValue("successful_updates_count", successful_updates_count)
		storeValue("failed_updates_count", failed_updates_count)
		storeValue("existing_updates_count", existing_updates_count)
		storeValue("member_ids_not_found_count", member_ids_not_found_count)

		return update_maximizer_results

	},	
}