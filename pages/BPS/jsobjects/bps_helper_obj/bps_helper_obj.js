export default {
	update_and_log_at_risk_mp_aap: async (patient_id, at_risk_for_mp_aap) => {
		let change_json = {}
		await get_existing_at_risk_mp_aap.run({patient_id: patient_id})
		const existing_at_risk_for_mp_aap = get_existing_at_risk_mp_aap.data?.[0]?.at_risk_mp_aap
		change_json["new_at_risk_for_mp_aap"] = at_risk_for_mp_aap		
		change_json["existing_at_risk_for_mp_aap"] = existing_at_risk_for_mp_aap
		try {
			await update_bps_at_risk_mp_aap.run({patient_id: patient_id, at_risk_for_mp_aap: at_risk_for_mp_aap})
			if (at_risk_for_mp_aap != existing_at_risk_for_mp_aap) {
				log.run({action_type: constants.update_bps_at_risk_for_mp_aap, ref_id: patient_id, ref_id_type: constants.patient_id, change_json: JSON.stringify(change_json) })	
			}
		}
		catch (e) {
			showAlert("Failed to update BPS At Risk for MP AAP. " + update_bps_at_risk_mp_aap.data)
		}
	},
	import_patient: async(patient_obj) => {
		if(!patient_obj) {
			showAlert("Patient object not found.")
			return 
		}

		const res = patient_obj
		// const enrollment_data = res?.enrollment_data || {}
		console.log(res)
		const enrollment_data = res?.patient_enrollment || "{}"
		const drug_patient = res["Drug Patient"] || ""
		// console.log(enrollment_data)
		const commercial_insurance = enrollment_data?.commercial_insurance || res?.patient_commercial_insurance || "{}"
		const verification_data = res?.verification_data || "{}"
		// console.log(verification_data)
		const patient_id = parseInt(res?.["Database ID"]) || ""
		const at_risk_for_map_aap = ""
		const original_enrollment_date_drug = res?.["Original Enrollment Date Drug"] || ""
		const segmentation_status = "New"
		const maximizer_program_name = ""
		const maximizer = ""
		const flag = ""
		const values_to_check = ""
		const coinsurance = ""
		const member_id = res?.["Member ID"] || ""
		const first_name = enrollment_data?.first_name || ""
		const last_name = enrollment_data?.last_name || ""
		const dob = this.convertDOB(enrollment_data?.date_of_birth || "") 
		const zip = String(enrollment_data?.address?.zip_code) || ""
		// console.log(zip)
		const enrollment_status = res?.["Enrollment Status"] || ""
		const enrollment_source = res?.["Enrollment Source"] || ""
		const rx_insurance_name = commercial_insurance?.rx_insurance?.name || ""
		const plan_bin = commercial_insurance?.rx_insurance?.bin || ""	
		const plan_pcn = commercial_insurance?.rx_insurance?.pcn || ""
		const plan_group = commercial_insurance?.rx_insurance?.group_number || ""
		const date_new_status =  this.convertDOB(Date.now())
		const date_pending_status = null
		const date_completed_status = null
		const date_escalation_status = null
		const date_reinvestigation_status = null
		const user_new_status = appsmith.user.username || ""
		const user_pending_status = "" // appsmith.user.username || ""
		const user_completed_status = "" // appsmith.user.username || ""
		const user_escalation_status = "" // appsmith.user.username || ""
		const user_reinvestigation_status = "" // appsmith.user.username || ""

		//const last_date_of_service = null
		// console.log("enrollment data " + enrollment_data)
		// console.log(res)
		// console.log(enrollment_data)
		// return
		const patient_enrollment_json = {
			"patient_id": patient_id,
			"at_risk_for_map_aap": at_risk_for_map_aap,
			"original_enrollment_date_drug": original_enrollment_date_drug,
			"segmentation_status": segmentation_status,
			"maximizer": maximizer,
			"flag": flag,
			"values_to_check": values_to_check,
			"coinsurance": coinsurance,
			"member_id": member_id,
			"first_name": first_name,
			"last_name": last_name,
			"dob": dob,
			"zip": zip,
			"enrollment_data": JSON.stringify(enrollment_data),
			"omni_check_verification_data": JSON.stringify(verification_data),									
			"enrollment_status": enrollment_status,
			"enrollment_source": enrollment_source,
			"rx_insurance_name": rx_insurance_name,
			"plan_bin": plan_bin,
			"plan_pcn": plan_pcn,
			"plan_group": plan_group,
			"date_new_status": date_new_status,
			"date_pending_status": date_pending_status,
			"date_completed_status": date_completed_status,
			"date_escalation_status": date_escalation_status,
			"date_reinvestigation_status": date_reinvestigation_status,
			"user_new_status": user_new_status,
			"user_pending_status": user_pending_status,
			"user_completed_status": user_completed_status,
			"user_escalation_status": user_escalation_status,
			"user_reinvestigation_status": user_reinvestigation_status,
			"maximizer_program_name": maximizer_program_name
		}
		showAlert(patient_enrollment_json)
		console.log(patient_enrollment_json)
		// return
		await get_patient_bps.run({patient_id: patient_id})	
		// don't add if enrollment matching patient_id exists or if status is duplicate
		if (get_patient_bps.data.length === 0 && enrollment_status != 'Duplicate' && enrollment_status != 'duplicate' && drug_patient == 'Y') 
		{
			await add_patient_bps_via_params.run(patient_enrollment_json)
			showAlert(`New patient imported ${first_name} ${last_name}`)
		} else {
			if (drug_patient.toUpperCase() == 'N') {
				showAlert(`Patient is a Drug 'N' patient and cannot be imported.`)		
			} else if (enrollment_status != 'Duplicate' || enrollment_status != 'duplicate') {
				showAlert(`Patient enrollment status is Duplicate and cannot be imported`)
			} else {
				showAlert(`Patient already exists in BPS database: ${first_name} ${last_name}`)			
			}
		}

	},
	auto_segment_via_claims_api: async(patient_id, is_new, refresh_lookup_table) => {
		if (!patient_id) {
			showAlert("Please select and highlight patient from above the the Patient Lookup Table and try again.")
			return
		}

		try{
			await get_patient_by_patient_id.run({patient_id: patient_id})

		} catch (e) {
			showAlert("Error getting patient info from database.  BPS Claims API aborted.")
			return
		}

		if (get_patient_by_patient_id.data.length == 0) {
			showAlert("No patient found matching patient id: " + patient_id.toString())
			return
		}

		// get the member id
		const patient_data = get_patient_by_patient_id.data[0]
		const member_id = patient_data?.member_id || ""

		const api_type = constants.bps_omni_check_api
		try{
			await get_claims_for_bps_claims_api2.run({patient_id: patient_id})
			showAlert("Found " + get_claims_for_bps_claims_api2.data.length.toString() + " claims associated with patient.")
		} catch (e) {
			showAlert("Error getting claims from database.  Autosegmentation aborted.")
			return
		}

		if (get_claims_for_bps_claims_api2.data.length == 0) {
			showAlert("No patient claims found. Unable to autosegment.")
			return
		}
		try{

			await bps_claims_api.run({member_id: member_id, claims: get_claims_for_bps_claims_api2.data})
			// showAlert(JSON.stringify(get_claims_for_bps_claims_api.data))
			console.log(get_claims_for_bps_claims_api.data)

		} catch(e) {
			showAlert("Error encountered calling BPS Claims API.  Autosegmentation stopped. " + JSON.stringify(bps_claims_api.data))
		}

		let maximizer_update_result = {}	
		let res
		// run the bps omni check api to get segmentation result
		try {

			// call omni-check api with payload
			await bps_claims_api.run({member_id: member_id, claims: get_claims_for_bps_claims_api2.data})
			res = await bps_claims_api.data
			console.log("result " + res)
		} catch (e) {
			showAlert("Error while calling BPS Claims API" + JSON.stringify(bps_claims_api.data))
		}		
		// return test stop
		// save payload and results in bps check history table 
		try {
			await add_bps_check_history.run({user_name: appsmith.user.username, patient_id: patient_id, submission_json: JSON.stringify(get_claims_for_bps_claims_api2.data), response_json: JSON.stringify(bps_claims_api?.data || {}), api_type: api_type})
			maximizer_update_result["add_bps_check_history"] = await add_bps_check_history.data
		} catch (e)	{
			showAlert("Failed to save bps payload and response to BPS Check History table")
			maximizer_update_result["add_bps_check_history"] = "Failed to save bps payload and response to BPS Check History table " + add_bps_check_history.data
		} 

		// parse bps segmentation result
		// use results to update bps patient table and segment
		if (res && res?.At_Risk_for_MP_AAP) {
			// unpack results

			const primary_data = bps_claims_api?.data
			// const plan_order = primary_data?.Plan_Order || ""
			// const plan_type = primary_data?.Plan_Type || ""

			let at_risk_for_mp_aap = primary_data?.At_Risk_for_MP_AAP?.toUpperCase() || "U|U"
			showAlert("Auto-Segmenting as " + at_risk_for_mp_aap)
			let at_risk_indicator_1 = primary_data?.At_Risk_Indicator_1 || ""
			let at_risk_indicator_2 = primary_data?.At_Risk_Indicator_2 || ""
			const maximizer_program_name = primary_data?.Maximizer_Program_Name || ""
			const flag = primary_data?.flag || ""
			const risk_analysis = primary_data?.risk_analysis || ""		// JSON stringified object that contains a key value pair of claim index from claims: maximizer result per claim


			let segmentation_status
			//////////////////////

			await get_existing_at_risk_mp_aap.run({patient_id: patient_id})
			const existing_at_risk_mp_aap = get_existing_at_risk_mp_aap.data?.[0]?.at_risk_mp_aap
			// showAlert("at_risk_for_mp_aap ", at_risk_for_mp_aap)
			if (is_new) {
				// For new enrollments
				// If at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y' then Segmentation Status: Complete
				// If at_risk_for_mp_aap = 'NA|NA', 'U|U' then Segmentation Status: New
				// I guess for NULL just make it 'U|U' then Segmentation Status: New		
				if (['Y|N', 'N|Y', 'N|N'].includes(at_risk_for_mp_aap)) {
					segmentation_status = "Completed"
				} else {
					segmentation_status = "New"
				}
			} else {
				// For existing enrollments				

				// If existing at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y' but BPS Omnicheck API  at_risk_for_mp_aap = 'NA|NA' we keep the existing results.
				if (at_risk_for_mp_aap == 'NA|NA') {
					// don't over-ride anything
					showAlert("BPS Claims Api returned at_risk_for_mp_aap = 'NA|NA' so no updates or changes will be made to the current BPS patient record")
					return
					// If existing at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y', 'U|U', 'NA|NA' but BPS Omnicheck API  at_risk_for_mp_aap =  'U|U' we override the previous segmentation and make Segmentation Status: New
				} else if (at_risk_for_mp_aap == 'U|U') {
					segmentation_status = "New"						
					// If existing at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y', 'U|U', 'NA|NA' but BPS Omnicheck API  at_risk_for_mp_aap = 'N|N', 'N|Y' we override the previous segmentation and make Segmentation Status: Completed
				} else if (at_risk_for_mp_aap == 'N|N' || at_risk_for_mp_aap == 'N|Y' ) {
					segmentation_status = "Completed"
					// If existing at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y', 'U|U', 'NA|NA' but BPS Omnicheck API  at_risk_for_mp_aap = 'Y|N' we override the previous segmentation and make Segmentation Status: Needs QC
				} else if (at_risk_for_mp_aap == 'Y|N') {
					// Can we make an update to the logic then? If at_risk_for_mp_aap = 'NULL' or 'U|U' and OmniCheck API = 'Y|N', 'N|Y', N|N we just set it as complete instead of Needs QC? And if its 'Y|N' we set Maximizer = '0'
					if (!existing_at_risk_mp_aap || existing_at_risk_mp_aap == 'NULL' || existing_at_risk_mp_aap == 'Maximizer = U and AAP = U' || existing_at_risk_mp_aap == 'Maximizer = Y and AAP = N') {
						segmentation_status = "Completed"
					} else {
						segmentation_status = "Needs QC"
					}

				}	else {
					showAlert("Segmentation Status Unrecognized. Unable to auto-segment patient: " + segmentation_status)
					return
				}				

			}
			///////////////////////

			// map indicator code to full description
			if (at_risk_indicator_1 in constants.indicator_1_mapping) {
				at_risk_indicator_1 = constants.indicator_1_mapping[at_risk_indicator_1]
			}

			// map indicator code to full description
			if (at_risk_indicator_2 in constants.indicator_2_mapping) {
				at_risk_indicator_2 = constants.indicator_2_mapping[at_risk_indicator_2]
			}

			// update at_risk_for_mp_aap data in bps db
			try {
				if (at_risk_for_mp_aap in constants.at_risk_for_mp_aap_mapping) {
					at_risk_for_mp_aap = constants.at_risk_for_mp_aap_mapping[at_risk_for_mp_aap]
				} else {
					at_risk_for_mp_aap = at_risk_for_mp_aap + " (not in mapping)"
				}
				if (at_risk_for_mp_aap)
				{					
					// only update if there is a value for at_risk_for_mp_aap
					await this.update_and_log_at_risk_mp_aap(patient_id, at_risk_for_mp_aap)
					maximizer_update_result["at_risk_for_mp_aap"] = at_risk_for_mp_aap
				}					// showAlert("Successfully updated At Risk MP | AAP")				
			} catch(e) {
				showAlert("Failed to update At Risk MP | AAP " + update_bps_at_risk_mp_aap.data)
				maximizer_update_result["at_risk_for_mp_aap"] = "Error updating at_risk_for_mp_aap in BPS data table " + update_bps_at_risk_mp_aap.data
			}

			// update maximizer_program_name in bps db
			if (maximizer_program_name) { 
				// only update if maximizer 			
				// update maximizer_program_name data fields in bps patient record
				try {
					await update_bps_maximizer_program.run({patient_id: patient_id, maximizer_program_name: maximizer_program_name})		
					maximizer_update_result["maximizer_program_name"] = maximizer_program_name
				} catch(e) {
					showAlert("Failed to update Program Name " + update_bps_maximizer_program.data)
					maximizer_update_result["maximizer_program_name"] = "Error updating maximizer_program_name in BPS data table " + update_bps_maximizer_program.data
				}
			} 

			// update_segmentation_status, which should update ps and main db if at_risk_for_mp_aap filled in bps db
			await this.update_segmentation_status(patient_id, member_id, segmentation_status, constants.bps_claims_api, refresh_lookup_table)

			let program_name_and_phone_number 
			if (maximizer_program_name in constants.program_name_and_phone_number_mapping) {
				program_name_and_phone_number = constants.program_name_and_phone_number_mapping[maximizer_program_name]		
			} else {
				program_name_and_phone_number = maximizer_program_name + " (not in mapping)"
			}									

			// payload to add to bps history
			const bps_payload = {
				user_name: constants.bps_claims_api,
				patient_id: patient_id,
				at_risk_for_mp_aap: at_risk_for_mp_aap,
				at_risk_indicator_1: at_risk_indicator_1,
				at_risk_indicator_2: at_risk_indicator_2, 
				at_risk_indicator_3: "",
				program_name_and_phone_number: program_name_and_phone_number 
			}

			try {
				if (at_risk_for_mp_aap && at_risk_indicator_1)
				{	// at_risk_for_mp_aap and at_risk_indicator_1 required				
					// save to bps history table (to capture indicator 1 and 2 data)
					await add_bps_history.run(bps_payload)
					maximizer_update_result["add_bps_history"] = bps_payload
				}					// add_bps_maximizer_patient			
			} catch(e) {
				showAlert("Error adding record to bps history: " + add_bps_history.data)
				maximizer_update_result["add_bps_history"] = "Error adding record to bps history: " + add_bps_history.data
			}

			const disposition = "Need to change segmentation"
			// save to notes as extra log
			try {
				// add notes 
				await notes_helper_obj.add_bps_note( appsmith.user.username, patient_id, disposition, "Auto Segmentation using " + api_type, new Date().toISOString().replace(/T/, ' ').replace(/Z/, ''), true)		
				maximizer_update_result["add_bps_note"] = disposition + " " + " Auto Segmentation using " + api_type
			} catch(e) {
				maximizer_update_result["add_bps_note"] = "Error adding record to bps history: " + add_bps_note.data
			}

			// storeValue("patient_id", patient_id)

			// // refresh patient lookup table too since bps at risk mp | aap updated
			// this.patient_bps_lookup(true, segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)



			// *************

			log.run({action_type: constants.auto_segmentation_claims_api, ref_id: member_id, ref_id_type: constants.member_id, change_json: JSON.stringify(maximizer_update_result) })	
			// if (appsmith.store.last_search_type == "text_and_type") {
			// // refresh for patient lookup table
			// bps_helper_obj.patient_bps_lookup(true, patient_lookup_txt.text, patient_lookup_list.selectedOptionValue, "", "")
			// } else {
			// this.patient_bps_lookup(true, "", segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)
			// }
			if (refresh_lookup_table) {
				// refresh bps history table
				get_bps_history.run({patient_id: patient_id})
				// refresh notes table
				get_bps_notes.run({patient_id: patient_id})				
			}		
			// return at_risk_for_mp_aap 
			return at_risk_for_mp_aap
			//////////////////////
		} else {
			showAlert("No results came back from Claims Check API or at_risk_for_mp_aap was NULL - no segmentation could be determined. This is what was returned by the BPS Omni-Check API " + JSON.stringify(res))
			return "Error"
		}

	},
	test_segmentation: async() => {
		const pids = [2011927,
									2011931,
									2011933,
									2011934,
									2011935,
									2011936,
									2011937,
									2011940,
									2011942,
									2011945,
									2011946,
									2011947,
									2011949,
									2011950,
									2011951,
									2011952,
									2011953,
									2011956,
									2011957,
									2011958,
									2011960,
									2011961,
									2011962,
									2011963,
									2011964,
									2011966,
									2011967,
									2011968,
									2011969,
									2011970,
									2011972,
									2011973,
									2011976,
									2011978,
									2011982,
									2011983,
									2011984,
									2011986,
									2011987,
									2011988,
									2011989,
									2011990,
									2011991]
		pids.forEach(async (pid) => (await this.auto_segment_via_bps_omni_check_api(pid, true)))
	},
	auto_segment_via_bps_omni_check_api: async (patient_id, is_new, refresh_lookup_table) => {

		// showAlert("feature being modified")
		// return 

		// patient_id = 258290
		if (!patient_id) {
			showAlert("Please select and highlight patient from above the the Patient Lookup Table and try again.")
			return
		}

		try{
			await get_patient_by_patient_id.run({patient_id: patient_id})

		} catch (e) {
			showAlert("Error getting patient info from database.  BPS omni-check API aborted.")
			return
		}
		if (get_patient_by_patient_id.data.length == 0) {
			showAlert("No patient found matching patient id: " + patient_id.toString())
			return
		}

		// create the payload
		const patient_data = get_patient_by_patient_id.data[0]
		const enrollment_data = patient_data?.enrollment_data // JSON.parse(patient_data?.enrollment_data || {})
		const provider_data = patient_data?.provider_data // JSON.parse(patient_data?.provider_data || {})
		const member_id = patient_data?.member_id || ""
		const first_name = patient_data?.first_name_v || ""
		const last_name = patient_data?.last_name_v || ""
		const dob = patient_data?.date_of_birth_v || ""
		const gender = enrollment_data?.gender == 'M' ? "Male" : "Female"
		const zip_code = patient_data?.zip_code_v || ""
		const npi = provider_data?.primary?.provider_npi || ""
		const state_code = patient_data?.state_v || ""
		const user_name = constants.bps_omni_check_api
		const api_type = constants.bps_omni_check_api
		if (zip_code.toString().length != 5) {
			showAlert("Five digit zip needed.")
			return
		}
		const payload = {
			"PATIENT_ID": member_id,
			"INSTANT_SAVINGS_ID__C": "",
			"ALTERNATIVE_ID": "",
			"FIRSTNAME": first_name,
			"LASTNAME": last_name,
			"DATE_OF_BIRTH__C": dob,
			"GENDER__C": gender,
			"MAILINGPOSTALCODE": zip_code,
			"NPI_NUMBER__C": npi,
			"NDC_CODE__C": "0000000000",
			"STATE_CODE": state_code
		}

		let maximizer_update_result = {}	
		let res 

		// run the bps omni check api to get segmentation result
		try {
			// call omni-check api with payload
			await bps_omni_check_api.run({payload:payload})
			res = await bps_omni_check_api.data
			console.log("result " + res)
		} catch (e) {
			showAlert("Error while calling BPS Omni-Check API" + JSON.stringify(bps_omni_check_api.data))
		}

		// return test stop
		// save payload and results in bps check history table 
		try {
			await add_bps_check_history.run({user_name: appsmith.user.username, patient_id: patient_id, submission_json: JSON.stringify(payload), response_json: JSON.stringify(bps_omni_check_api?.data || {}), api_type: api_type})
			maximizer_update_result["add_bps_check_history"] = await add_bps_check_history.data
		} catch (e)	{
			showAlert("Failed to save bps payload and response to BPS Check History table")
			maximizer_update_result["add_bps_check_history"] = "Failed to save bps payload and response to BPS Check History table " + add_bps_check_history.data
		} 

		// parse bps segmentation result
		// use results to update bps patient table and segment
		if (res.length > 0 && res[0]?.At_Risk_for_MP_AAP) {
			// unpack results
			let fields_with_data = 0
			const primary_data = res[0]
			// const plan_order = primary_data?.Plan_Order || ""
			// const plan_type = primary_data?.Plan_Type || ""
			const pbm_name = res[0]?.PBMName || ""
			const plan_name = res[0]?.PlanName || ""
			const bin = res[0]?.BIN || ""
			const pcn = res[0]?.PCN || ""
			const group = res[0]?.Group || ""
			const insurance_member_id = res[0]?.Plan_ID || ""
			if (pbm_name) fields_with_data++
			if (plan_name) fields_with_data++
			if (bin) fields_with_data++
			if (pcn) fields_with_data++
			if (group) fields_with_data++
			let at_risk_for_mp_aap = res[0]?.At_Risk_for_MP_AAP?.toUpperCase() || "U|U"
			showAlert("Auto-Segmenting as " + at_risk_for_mp_aap)
			let at_risk_indicator_1 = res[0]?.At_Risk_Indicator_1 || ""
			let at_risk_indicator_2 = res[0]?.At_Risk_Indicator_2 || ""
			const maximizer_program_name = res[0]?.Maximizer_Program_Name || ""
			// showAlert(pbm_name + bin + pcn + at_risk_for_mp_aap + at_risk_indicator_1)
			// payload to update ins data 

			const ins_payload = {
				"PBMName": primary_data?.PBMName || "",
				"PlanName": primary_data?.PlanName || "",
				"BIN": primary_data?.BIN || "",
				"PCN": primary_data?.PCN || "",
				"Group": primary_data?.Group || "",
				"MemberId": primary_data?.Plan_ID || "",
				"PBMPhone": "",
				"PersonCode": "",
				"StartDate": "",
				"EndDate": "",
				"IsCalendarYearPlan": "",
				"PAPhone": "",
				"PAFax": ""
			}						
			// only update if 3 or more datapoints available for insurance 
			if (fields_with_data >= 3) {
				try {
					this.update_omni_check_insurance_info(patient_id, ins_payload)
					showAlert("Omni-check insurance data updated")
				} catch (e) {
					showAlert("Error updating omni-check insurance data.")
				}
			}

			let segmentation_status
			//////////////////////
			const existing_at_risk_mp_aap = await get_existing_at_risk_mp_aap.run({patient_id: patient_id})
			showAlert("at_risk_for_mp_aap ", at_risk_for_mp_aap)
			if (is_new) {
				// For new enrollments
				// If at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y' then Segmentation Status: Complete
				// If at_risk_for_mp_aap = 'NA|NA', 'U|U' then Segmentation Status: New
				// I guess for NULL just make it 'U|U' then Segmentation Status: New		
				if (['Y|N', 'N|Y', 'N|N'].includes(at_risk_for_mp_aap)) {
					segmentation_status = "Completed"
				} else {
					segmentation_status = "New"
				}
			} else {
				// For existing enrollments				

				// If existing at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y' but BPS Omnicheck API  at_risk_for_mp_aap = 'NA|NA' we keep the existing results.
				if (at_risk_for_mp_aap == 'NA|NA') {
					// don't over-ride anything
					showAlert("BPS Omni-Check Api returned at_risk_for_mp_aap = 'NA|NA' so no updates or changes will be made to the current BPS patient record")
					return
					// If existing at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y', 'U|U', 'NA|NA' but BPS Omnicheck API  at_risk_for_mp_aap =  'U|U' we override the previous segmentation and make Segmentation Status: New
				} else if (at_risk_for_mp_aap == 'U|U') {
					segmentation_status = "New"						
					// If existing at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y', 'U|U', 'NA|NA' but BPS Omnicheck API  at_risk_for_mp_aap = 'N|N', 'N|Y' we override the previous segmentation and make Segmentation Status: Completed
				} else if (at_risk_for_mp_aap == 'N|N' || at_risk_for_mp_aap == 'N|Y' ) {
					segmentation_status = "Completed"
					// If existing at_risk_for_mp_aap = 'Y|N', 'N|N', 'N|Y', 'U|U', 'NA|NA' but BPS Omnicheck API  at_risk_for_mp_aap = 'Y|N' we override the previous segmentation and make Segmentation Status: Needs QC
				} else if (at_risk_for_mp_aap == 'Y|N') {
					// Can we make an update to the logic then? If at_risk_for_mp_aap = 'NULL' or 'U|U' and OmniCheck API = 'Y|N', 'N|Y', N|N we just set it as complete instead of Needs QC? And if its 'Y|N' we set Maximizer = '0'
					if (!existing_at_risk_mp_aap || existing_at_risk_mp_aap == 'NULL' || existing_at_risk_mp_aap == 'Maximizer = U and AAP = U'|| existing_at_risk_mp_aap == 'Maximizer = Y and AAP = N') {
						segmentation_status = "Completed"
					} else {
						segmentation_status = "Needs QC"
					}

				}	else {
					showAlert("Segmentation Status Unrecognized. Unable to auto-segment patient: " + segmentation_status)
					return
				}				

			}
			///////////////////////

			// map indicator code to full description
			if (at_risk_indicator_1 in constants.indicator_1_mapping) {
				at_risk_indicator_1 = constants.indicator_1_mapping[at_risk_indicator_1]
			}

			// map indicator code to full description
			if (at_risk_indicator_2 in constants.indicator_2_mapping) {
				at_risk_indicator_2 = constants.indicator_2_mapping[at_risk_indicator_2]
			}

			// update at_risk_for_mp_aap data in bps db
			try {
				if (at_risk_for_mp_aap in constants.at_risk_for_mp_aap_mapping) {
					at_risk_for_mp_aap = constants.at_risk_for_mp_aap_mapping[at_risk_for_mp_aap]
				} else {
					at_risk_for_mp_aap = at_risk_for_mp_aap + " (not in mapping)"
				}
				if (at_risk_for_mp_aap)
				{					
					// only update if there is a value for at_risk_for_mp_aap
					await this.update_and_log_at_risk_mp_aap(patient_id, at_risk_for_mp_aap)
					// await update_bps_at_risk_mp_aap.run({patient_id: patient_id, at_risk_for_mp_aap: at_risk_for_mp_aap})
					maximizer_update_result["at_risk_for_mp_aap"] = at_risk_for_mp_aap
				}					// showAlert("Successfully updated At Risk MP | AAP")				
			} catch(e) {
				showAlert("Failed to update At Risk MP | AAP " + update_bps_at_risk_mp_aap.data)
				maximizer_update_result["at_risk_for_mp_aap"] = "Error updating at_risk_for_mp_aap in BPS data table " + update_bps_at_risk_mp_aap.data
			}

			// update maximizer_program_name in bps db
			if (maximizer_program_name) { 
				// only update if maximizer 			
				// update maximizer_program_name data fields in bps patient record
				try {
					await update_bps_maximizer_program.run({patient_id: patient_id, maximizer_program_name: maximizer_program_name})		
					maximizer_update_result["maximizer_program_name"] = maximizer_program_name
				} catch(e) {
					showAlert("Failed to update Program Name " + update_bps_maximizer_program.data)
					maximizer_update_result["maximizer_program_name"] = "Error updating maximizer_program_name in BPS data table " + update_bps_maximizer_program.data
				}
			} 

			// update_segmentation_status, which should update ps and main db if at_risk_for_mp_aap filled in bps db
			await this.update_segmentation_status(patient_id, member_id, segmentation_status, constants.bps_omni_check_api, refresh_lookup_table)

			let program_name_and_phone_number 
			if (maximizer_program_name in constants.program_name_and_phone_number_mapping) {
				program_name_and_phone_number = constants.program_name_and_phone_number_mapping[maximizer_program_name]		
			} else {
				program_name_and_phone_number = maximizer_program_name + " (not in mapping)"
			}									

			// payload to add to bps history
			const bps_payload = {
				user_name: user_name,
				patient_id: patient_id,
				at_risk_for_mp_aap: at_risk_for_mp_aap,
				at_risk_indicator_1: at_risk_indicator_1,
				at_risk_indicator_2: at_risk_indicator_2, 
				at_risk_indicator_3: "",
				program_name_and_phone_number: program_name_and_phone_number 
			}

			try {
				if (at_risk_for_mp_aap && at_risk_indicator_1)
				{	// at_risk_for_mp_aap and at_risk_indicator_1 required				
					// save to bps history table (to capture indicator 1 and 2 data)
					await add_bps_history.run(bps_payload)
					maximizer_update_result["add_bps_history"] = bps_payload
				}					// add_bps_maximizer_patient			
			} catch(e) {
				showAlert("Error adding record to bps history: " + add_bps_history.data)
				maximizer_update_result["add_bps_history"] = "Error adding record to bps history: " + add_bps_history.data
			}

			const disposition = "Need to change segmentation"
			// save to notes as extra log
			try {
				// add notes 
				await notes_helper_obj.add_bps_note( appsmith.user.username, patient_id, disposition, "Auto Segmentation using " + api_type, new Date().toISOString().replace(/T/, ' ').replace(/Z/, ''), true)		
				maximizer_update_result["add_bps_note"] = disposition + " " + " Auto Segmentation using " + api_type
			} catch(e) {
				maximizer_update_result["add_bps_note"] = "Error adding record to bps history: " + add_bps_note.data
			}

			// storeValue("patient_id", patient_id)

			// // refresh patient lookup table too since bps at risk mp | aap updated
			// this.patient_bps_lookup(true, segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)



			// *************

			log.run({action_type: constants.auto_segmentation_omni_check_api, ref_id: member_id, ref_id_type: constants.member_id, change_json: JSON.stringify(maximizer_update_result) })	
			// if (appsmith.store.last_search_type == "text_and_type") {
			// // refresh for patient lookup table
			// bps_helper_obj.patient_bps_lookup(true, patient_lookup_txt.text, patient_lookup_list.selectedOptionValue, "", "")
			// } else {
			// this.patient_bps_lookup(true, "", segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)
			// }
			if (refresh_lookup_table) {
				// refresh bps history table
				get_bps_history.run({patient_id: patient_id})
				// refresh notes table
				get_bps_notes.run({patient_id: patient_id})				
			}		

			//////////////////////

		} else {
			showAlert("No results came back from Omni Check API or at_risk_for_mp_aap was NULL - no segmentation could be determined. This is what was returned by the BPS Omni-Check API " + JSON.stringify(res))
		}

	},
	bps_omni_check: async ( patient_id, instant_savings_id, alternative_id, first_name, last_name, dob, gender, zip_code, npi, ndc, state ) => {
		if (!patient_id || !first_name || !last_name || !dob || !gender || zip_code ) {
			showAlert("Patient ID, First Name, Last Name, DOB, Gender, Zip Code are all Required.")
			return
		}
		const payload = {"patient_id": patient_id, "instant_savings_id": instant_savings_id, "alternative_id": alternative_id, "first_name": first_name, "last_name": last_name, "dob": dob, "gender": gender, "zip_code": zip_code, "npi": npi, "ndc": ndc, "state": state}
		await bps_omni_check_api.run({payload})
	},
	update_omni_check_insurance_info: async (patient_id, ins_json_obj) => {
		if (!patient_id) {
			showAlert("Please select and highlight patient in lookup table to update insurance info")
			return 
		}
		ins_json_obj = ins_json_obj[0] || ins_json_obj 
		const PBMName = ins_json_obj?.PBMName || ""
		const PlanName = ins_json_obj?.PlanName || ""
		const BIN = ins_json_obj?.BIN || ""
		const PCN = ins_json_obj?.PCN || ""
		const Group = ins_json_obj?.Group || ""	
		const MemberId = ins_json_obj?.MemberId || ""
		const PBMPhone = ins_json_obj?.PBMPhone || ""
		const PersonCode = ins_json_obj?.PersonCode || ""
		const StartDate = ins_json_obj?.StartDate || ""
		const EndDate = ins_json_obj?.EndDate || ""		
		const IsCalendarYearPlan = ins_json_obj?.IsCalendarYearPlan || ""
		const PAPhone = ins_json_obj?.PAPhone || ""		
		const PAFax = ins_json_obj?.PAFax || ""	
		const ins_payload = {
			"PBMName": PBMName,
			"PlanName": PlanName,
			"BIN": BIN,
			"PCN": PCN,
			"Group": Group,
			"MemberId": MemberId,
			"PBMPhone": PBMPhone,
			"PersonCode": PersonCode,
			"StartDate": StartDate,
			"EndDate": EndDate,
			"IsCalendarYearPlan": IsCalendarYearPlan,
			"PAPhone": PAPhone,
			"PAFax": PAFax
		}		
		let key
		let updated_ins
		// showAlert(JSON.stringify(ins_json_obj))
		// showAlert(JSON.stringify(ins_payload))		
		console.log(ins_json_obj)
		await get_patient_verification_data.run(({patient_id: patient_id}))
		let omni_check_verification_data = await get_patient_verification_data.data?.[0] // patient_lookup_table.selectedRow.omni_check_verification_data
		console.log("omni_check_verification_data " + omni_check_verification_data)
		// check that verification data is not empty set in lookup table 
		if ((Object.keys(omni_check_verification_data).length === 0) || !omni_check_verification_data) {
			// use default template to create verification json since none exists
			omni_check_verification_data = constants.empty_omni_check_verification_json
		}

		// console.log(omni_check_verification_data)
		// if((Object.keys(patient_lookup_table.selectedRow.omni_check_verification_data).length === 0) || Object.keys(ins_json_obj).length === 0) {
		// showAlert("omni check insurance json is null")
		// // ins_json_obj = omni_check_verif_response_json.formData
		// key = 0
		// updated_ins = ins_payload
		// if (Object.keys(updated_ins).length === 0) {
		// updated_ins = constants.empty_omni_check_verification_json.response.omniCheckInsuranceInfo
		// }
		// // omni_check_verification_data.response.omniCheckInsuranceInfo = []
		// omni_check_verification_data.response.omniCheckInsuranceInfo = updated_ins
		// console.log(omni_check_verification_data.response.omniCheckInsuranceInfo)
		// // return
		// } else {
		// showAlert("omni check insurance json is NOT null " + patient_lookup_table.selectedRow.omni_check_verification_data.length)
		// 
		// const keys = Object.keys(ins_json_obj)
		// const key = keys[0]		
		// updated_ins = ins_json_obj[key]
		// // handle array in array case
		// if (Array.isArray(updated_ins)) {
		// updated_ins = updated_ins[0]
		// }
		// 
		// let one_off = false		
		// // one_off = true
		// // if (one_off || Object.keys(updated_ins).length === 0) {
		// if (one_off) {
		// showAlert("doing one-off")
		// updated_ins = constants.empty_omni_check_verification_json.response.omniCheckInsuranceInfo
		// omni_check_verification_data.response.omniCheckInsuranceInfo = updated_ins
		// }	else if (!('omni_check_verification_data.response.omniCheckInsuranceInfo' in omni_check_verification_data.response)){
		// showAlert("push updated insurance " + updated_ins)
		// // omni_check_verification_data.response["omniCheckInsuranceInfo"] = []	
		// omni_check_verification_data.response.omniCheckInsuranceInfo = [updated_ins]
		// } else {
		// showAlert("update key of updated insurance" + updated_ins)
		// omni_check_verification_data.response.omniCheckInsuranceInfo = [updated_ins]			
		// }			
		// console.log(omni_check_verification_data.response.omniCheckInsuranceInfo[key])
		// }

		// console.log(Object.keys(ins_json_obj))

		console.log("omni_check_verification_data.response " + omni_check_verification_data.response)
		try {
			omni_check_verification_data.response["omniCheckInsuranceInfo"] = [ins_payload]			
		} catch (e) {
			// omni_check_verification_data = constants.empty_omni_check_verification_json
			omni_check_verification_data["response"] = {"omniCheckInsuranceInfo": [ins_payload]}		
		}



		try {
			const omni_check_verification_data_stringified = JSON.stringify(omni_check_verification_data)
			await update_omni_check_verification.run({patient_id: patient_id, omni_check_verification_data: omni_check_verification_data_stringified})
			showAlert("Update of omni-check insurance successful")
			// showAlert("Update of omni-check insurance successful " + omni_check_verification_data.response.omniCheckInsuranceInfo[key])
			this.patient_bps_lookup(true, segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)			
		} catch(e) {
			showAlert("Error updating omni-check insurance data " + JSON.stringify(e))
		}
		// patient_lookup_table.selectedRow.omni_check_verification_data?.response?.omniCheckInsuranceInfo
	},
	fill_form_bps_history: (h) => {
		console.log(JSON.stringify(h))		
		at_risk_mp_aap_sel.setSelectedOption(h?.at_risk_for_map_aap)
		at_risk_indicator1_sel.setSelectedOption(h?.at_risk_indicator_1)
		at_risk_indicator2_sel.setSelectedOption(h?.at_risk_indicator_2)
		at_risk_indicator3_inp.setValue(h?.at_risk_indicator_3)
		bps_program_phone_number_sel.setSelectedOption(h?.program_name_and_phone_number)
	},
	get_and_store_bps_notes: async (provider_id, dest) => {
		// showAlert("get_bps_notes pid " + provider_id )
		storeValue("provider_Id", provider_id)
		await get_bps_notes.run({provider_id: provider_id})
		const notes = await get_bps_notes.data;
		if (dest == 'qc') {
			storeValue("qc_bps_notes", notes)
		} else {
			storeValue("bps_notes", notes)
		}
		return notes
	},	
	get_and_store_bps_history: async (provider_id, dest) => {
		storeValue("provider_Id", provider_id)
		showAlert("get_bps_history pid " + provider_id )
		await get_bps_history.run({provider_id: provider_id})
		const bps_history = await get_bps_history.data;
		if (dest == 'qc') {
			storeValue("qc_bps_history", bps_history)
		} else {
			storeValue("bps_history", bps_history)
		}
		return bps_history
	},	
	get_qc_queue: async () => {
		await get_maximizer_qc_queue.run()
		const q = await get_maximizer_qc_queue.data;
		if (q.length > 0) {
			const mapped_q = this.map_patients(q)
			storeValue("mapped_q", mapped_q)
			return mapped_q
		} else {
			storeValue("mapped_q", [])
			return []
		}
	},
	map_patients: (patients) => {
		const mapped_patients = patients.map(function (search_result) {
			console.log("search_result in map_patient")
			console.log(search_result)
			const enrollment_data = JSON.parse(search_result?.enrollment_data || "{}");

			// const commercial_insurance = enrollment_data?.commercial_insurance || "{}";

			const omni_check_verification_data = JSON.parse(search_result?.omni_check_verification_data || "{}");
			const insurance_info = omni_check_verification_data?.response?.omniCheckInsuranceInfo?.[0]
			console.log("omni-check verification data")
			console.log(omni_check_verification_data)
			console.log("omni-check insurance_info")
			console.log(insurance_info)			

			let last_modified_by = search_result?.user_new_status || "";
			let last_modified_date = search_result?.date_new_status || ""

			if (search_result?.date_pending_status && search_result?.date_pending_status > last_modified_date) {
				last_modified_by = search_result?.user_pending_status || "Username Missing"
				last_modified_date = search_result?.date_pending_status 		
			} else if (search_result?.date_completed_status && search_result?.date_completed_status > last_modified_date)	{
				last_modified_by = search_result?.user_completed_status || "Username Missing"
				last_modified_date = search_result?.date_completed_status 						
			} else if (search_result?.date_escalation_status && search_result?.date_escalation_status > last_modified_date)	{
				last_modified_by = search_result?.user_escalation_status || "Username Missing"
				last_modified_date = search_result?.date_escalation_status 						
			} else if (search_result?.date_reinvestigation_status && search_result?.date_reinvestigation_status > last_modified_date)	{
				last_modified_by = search_result?.user_reinvestigation_status || "Username Missing"
				last_modified_date = search_result?.date_reinvestigation_status 						

			}			



			return {

				"At Risk for MP | AAP": search_result?.at_risk_for_mp_aap || "",
				"Original Enrollment Date Drug": search_result?.original_enrollment_date_drug || "",
				"Segmentation Status": search_result?.segmentation_status || "",
				// "maximizer": search_result?.maximizer || "",
				// "flag": search_result?.flag || "",
				// "values_to_check": search_result?.values_to_check || "",
				// "coinsurance": search_result?.coinsurance || "",
				"Member ID": search_result?.member_id || "",
				"First Name": search_result?.first_name || "",
				"Last Name":search_result?.last_name || "",
				"Date of Birth": search_result?.dob || "",
				"ZIP": search_result?.zip || "",
				"Phone Number": enrollment_data?.phone || enrollment_data?.phone_number || "",
				"Enrollment Status": search_result?.enrollment_status || "",
				// "Rx Insurance Name": search_result?.rx_insurance_name || "",
				// "BIN": search_result?.plan_bin || "",
				// "PCN": search_result?.plan_pcn || "",
				// "Group": search_result?.plan_group || "",
				"Last Modified By": last_modified_by,
				"Omni PBMName": insurance_info?.PBMName || "",
				"Omni PlanName": insurance_info?.PlanName || "",
				"Omni BIN": insurance_info?.BIN || "",
				"Omni PCN": insurance_info?.PCN || "",
				"Omni Group": insurance_info?.Group || "",
				"Omni StartDate": insurance_info?.StartDate || "",
				"Omni EndDate": insurance_info?.EndDate || "",				
				// "enrollment_data": enrollment_data,
				"omni_check_verification_data": omni_check_verification_data,

				// "enrollment_source": search_result?.enrollment_source || "",

				// "date_new_status": search_result?.date_new_status || "",
				// "date_pending_status": search_result?.date_pending_status || "",				
				// "date_completed_status": search_result?.date_completed_status || "",
				// "date_escalation_status": search_result?.date_escalation_status || "",
				// "date_reinvestigation_status": search_result?.date_reinvestigation_status || "",			
				"New BPS Enrollment Processed By": search_result?.user_new_status || "",
				// "user_pending_status": search_result?.user_pending_status || "",
				// "user_completed_status": search_result?.user_completed_status || "",
				// "user_escalation_status": search_result?.user_escalation_status || "",
				// "user_reinvestigation_status": search_result?.user_reinvestigation_status || "",
				"Maximizer Program Name": search_result?.maximizer_program_name || "",
				"patient_id": search_result?.patient_id || "",			
				"Date BPS Enrollment Processed": search_result?.created || ""

			};
		});		
		return mapped_patients;
	},
	refresh_lookup_table: () => {
		this.patient_bps_lookup("", segmentation_status_sel.selectedOptionValue, enrollment_date_from_pkr.formattedDate, enrollment_date_to_pkr.formattedDate)
	},
	clear_bps_fields: () => {
		at_risk_mp_aap_sel.setSelectedOption("")
		at_risk_indicator1_sel.setSelectedOption("")
		at_risk_indicator2_sel.setSelectedOption("")
		at_risk_indicator3_inp.setValue("")
		bps_program_phone_number_sel.setSelectedOption("")
	},
	async update_segmentation_status(patient_id, member_id, new_status, username, refresh_lookup_table) {
		if (!patient_id) {
			showAlert("Unable to update segmentation status because patient id is blank or cannot be read.")
			return
		}

		// if pending status, only person who put this in pending can add this bps record with exception of a manager 
		if (patient_lookup_table?.triggeredRow?.segmentation_status == 'Pending') {  
			if (patient_lookup_table.triggeredRow.user_pending_status != appsmith.user.username && appsmith.user.username in permissions_helper_obj.user_permission_level && permissions_helper_obj.user_permission_level[appsmith.user.username] >= 2) {
				showAlert("Action is locked and can only be done by " + patient_lookup_table.triggeredRow.user_pending_status  + " or an authorized manager.") 
				return
			}
		}

		storeValue("patient_id", patient_id) // don't need to check since triggered row value
		// showAlert(new_status)
		try {
			// id = parseInt(id)
			await update_bps_segmentation_status.run({patient_id: patient_id, segmentation_status: new_status})
		} catch(e) {
			showAlert("Error updating segmentation status " + JSON.stringify(e))
		}

		if (update_bps_segmentation_status.data[0].affectedRows == 0) {
			showAlert("Record ID could not be found to update.  Please requery if necessary.")
			return
		}
		// update user and time stamp 
		if (new_status == 'Pending') {
			// showAlert("Pending Matched")
			await update_pending_user_dt.run({patient_id: patient_id, username: username})
		} else if (new_status == 'Completed') {
			// showAlert("Completed Matched")
			await update_completed_user_dt.run({patient_id: patient_id, username: username})
		} else if (new_status == 'Escalation') {
			// showAlert("Escalation Matched")
			await update_escalation_user_dt.run({patient_id: patient_id, username: username})
		} else if (new_status == 'Reinvestigation') {
			// showAlert("Reinvestigation Matched")
			await update_reinvestigation_user_dt.run({patient_id: patient_id, username: username})
			// do we need to change maximizer status to 2 if Maximizer = Y and AAP = N?
		} else if (new_status == 'Needs QC') {
			await update_needs_qc_user_dt.run({patient_id: patient_id, username: username})
			// update main database as maximizer_status 2 
			// update maximizer status in main db 
			try {
				await update_copay_maximizer_status.run({"patient_id": patient_id, "maximizer_patient": 2})
				showAlert("Successfully updated Main Database Maximizer Status to " + "2")

			} catch (e) {
				showAlert("Failed to update Main Database Maximizer Status")					

			}				

		} else if (new_status == 'Approve') {

			storeValue("maximizer", "Y")
			await update_qc_user_dt.run({patient_id: patient_id, maximizer: 'Y', username: username})		
		}			

		if (new_status == 'Completed' || new_status == 'Approve') {
			let maximizer_update_result = {}

			await get_patient_at_risk_mp_aap.run({patient_id: patient_id})

			if (get_patient_at_risk_mp_aap.data.length > 0 && get_patient_at_risk_mp_aap.data[0].at_risk_for_mp_aap ) 
			{
				let maximizer_status
				let member_group 
				// only update main db and ps if at_risk_for_mp_aap is not empty
				if (get_patient_at_risk_mp_aap.data[0].at_risk_for_mp_aap == "Maximizer = Y and AAP = N") {
					maximizer_status = 0 // maximizer
					member_group = "100073A"
				} else {
					maximizer_status = 1 // non-maximizer
					member_group = "100073"
				}
				// update maximizer status in main db 
				try {
					await update_copay_maximizer_status.run({"patient_id": patient_id, "maximizer_patient": maximizer_status})
					showAlert("Successfully updated Main Database Maximizer Status to " + maximizer_status.toString())
					maximizer_update_result["update_copay_maximizer_status"] = await update_copay_maximizer_status.data

				} catch (e) {
					showAlert("Failed to update Main Database Maximizer Status")					
					maximizer_update_result["update_copay_maximizer_status"] = "Error updating maximizer_status in Main data table " + e
				}

				try {						
					// update maximizer status at ps 
					await update_patient_member_grp_ps.run({member_group: member_group, member_id: member_id})
					showAlert("Successfully updated Paysign Member Group to Maximizer")
					maximizer_update_result["update_patient_member_grp_ps"] = await update_patient_member_grp_ps.data
					// log here for billing
					await log.run({action_type: constants.update_patient_member_group + " " + member_group, ref_id: member_id, ref_id_type: constants.member_id, change_json: JSON.stringify(update_patient_member_grp_ps.data) })						
				} catch (e) {
					if (update_patient_member_grp_ps.data?.message == 'No subgroup change detected.') {
						showAlert("No change in member group detected.  Patient already in Paysign member Group " + member_group)
						maximizer_update_result["update_patient_member_grp_ps"] = "No change in member group detected.  Patient already in Paysign member Group " + member_group
					} else {
						showAlert("Failed to update Paysign member Group.  All other updates aborted.  " + update_patient_member_grp_ps.data)
						maximizer_update_result["update_patient_member_grp_ps"] = "Failed to update Paysign member Group.  All other updates aborted.  " + update_patient_member_grp_ps.data
					}


					log.run({action_type: constants.update_bps_segmentation_status, ref_id: member_id.toString() || "", ref_id_type: constants.member_id, change_json: JSON.stringify(maximizer_update_result) })							
				}

				if (refresh_lookup_table) {
					if (appsmith.store.last_search_type == "date_and_status") {
						// refresh for patient lookup table
						bps_helper_obj.patient_bps_lookup(true, "", segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)
					} else {
						bps_helper_obj.patient_bps_lookup(true, patient_lookup_txt.text, patient_lookup_list.selectedOptionValue, "", "")
					}					
				}
			}

			// showAlert("Segmentation Status Successfully Updated to: " + new_status + ".")
			this.patient_bps_lookup(true, segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)

		}
	}
	,
	bps_segmented_patient_lookup: async (inputText, selectedOptionValue, start_date, end_date) => {

		await clearStore()

		let search_results = []

		if (selectedOptionValue == "member_id") {
			search_results = await get_segmented_patient_by_mid.run({member_id: inputText});
			// search_results = await res.data
			// storeValue("member_id", inputText)
			// storeValue("first_name", "%")
			// storeValue("last_name", "%")
			// storeValue("dob", "%")
		} else if (selectedOptionValue == "first_name") {
			inputText = "%" + inputText + "%"
			search_results = await get_segmented_patients_by_name.run({first_name: inputText, last_name: "%"});
		} else if (selectedOptionValue == "last_name") {
			inputText = "%" + inputText + "%"
			search_results = await get_segmented_patients_by_name.run({first_name: "%", last_name: inputText});
		} else if (selectedOptionValue == "dob") {
			search_results = await get_segmented_patients_by_dob.run({dob: inputText});		
		}

		showAlert(`${search_results.length} patients found, mapping results`)
		const mapped_results = this.map_patients(search_results) 
		storeValue("bps_mapped_patients", mapped_results)
		return search_results
		// TODO: Map results
		// const mapped_patients = this.map_patient(search_results);
		// storeValue("mapped_patients", mapped_patients);
		// return mapped_patients;		

	},
	patient_lookup: async (inputText, selectedOptionValue, start_date, end_date) => {
		try {

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
				} else {
					if (selectedOptionValue === "dob") {
						inputText = this.convertDOB(inputText);
					}
					search_results = await patient_search_api.run( {selected_option_value: selectedOptionValue, input_text: inputText});	
					if (search_results.length === 0) { showAlert("No patients found"); return; }
				}
			}

			showAlert(`${search_results.length} patients found, mapping results`)

			const mapped_patients = this.map_patients(search_results);
			storeValue("mapped_import_patients", mapped_patients);
			return mapped_patients;
		} catch (e) {
			showAlert(e.message);
			return [];
		}
	},
	convertToDateTime(date) {
		date = moment(date).format('MMMM Do YYYY, h:mm:ss a');
		console.log(date)
		return date
	},
	patient_bps_lookup: async (is_refresh, input_text, selectedOptionValue, start_date, end_date) => {

		let search_results = []
		try {
			if (!start_date && !end_date)	{
				if (!input_text) {
					// validate fields for input text search 
					showAlert("Please enter text value to search.");
					return [];		
				}
				if (selectedOptionValue == "member_id") {
					search_results = await get_segmented_patient_by_mid.run({member_id: input_text});
					// search_results = await res.data
					// storeValue("member_id", inputText)
					// storeValue("first_name", "%")
					// storeValue("last_name", "%")
					// storeValue("dob", "%")
				} else if (selectedOptionValue == "first_name") {
					input_text = "%" + input_text + "%"
					search_results = await get_segmented_patients_by_name.run({first_name: input_text, last_name: "%"});
				} else if (selectedOptionValue == "last_name") {
					input_text = "%" + input_text + "%"
					search_results = await get_segmented_patients_by_name.run({first_name: "%", last_name: input_text});
				} else if (selectedOptionValue == "dob") {
					search_results = await get_segmented_patients_by_dob.run({dob: input_text});		
				} else if (selectedOptionValue == "patient_id") {
					search_results = await get_segmented_patient_by_pid.run({patient_id: input_text})
				}

			} else {
				if (!start_date || !end_date) {
					showAlert("Please enter a start and end date range.")
					return [];
				};
				await get_patient_bps_by_status_dt.run({start_date: start_date, end_date: end_date, segmentation_status: selectedOptionValue})
				search_results = await get_patient_bps_by_status_dt.data				
				storeValue("start_date", enrollment_date_from_pkr.formattedDate) 

				storeValue("end_date", enrollment_date_to_pkr.formattedDate) 


			}

			if (!is_refresh) showAlert(`${search_results.length} patients found`)			
			//showAlert(`${search_results.length} patients found, mapping results`)

			const mapped_patients = this.map_patients(search_results);
			//storeValue("mapped_patients", mapped_patients);
			//return mapped_patients;
			// storeValue("bps_enrollments", search_results);
			storeValue("bps_mapped_patients", mapped_patients);
			return search_results
		} catch (e) {
			showAlert(e.message);
			return [];
		}		
		// try {
		// // clear store to free up memory
		// // clearStore() don't clear store because date being passed via store
		// 
		// // search text and option value blank so validate for searching by enrollment date
		// // if (!inputText && !selectedOptionValue) {
		// // validate date fields for enrollment search
		// // start and end dates blank so validate regular lookup
		// 
		// // if (selectedOptionValue == "%") {
		// // showAlert("All Selected")
		// // }
		// 
		// // if (start_date && end_date) {
		// // 
		// // showAlert("Searching enrollments from " + start_date + " to " + end_date);
		// // //start_date = moment(start_date).format('YYYY-MM-DD hh:mm:ss')
		// // //end_date = moment(end_date).format('YYYY-MM-DD hh:mm:ss')
		// // //start_date = "'" + start_date.toString() + "'";
		// // //end_date = "'" + end_date.toString() + "'";
		// // storeValue('enrollment_start_date', start_date);
		// // storeValue('enrollment_end_date', end_date);
		// // showAlert("getting search results")
		// // if (selectedOptionValue == 'All') {
		// // await get_new_patient_bps_by_dt.run({start_date: start_date, end_date: end_date});
		// // search_results = get_new_patient_bps_by_dt.data;					
		// // } else if (selectedOptionValue == 'New') {
		// // await get_new_patient_bps_by_dt.run({start_date: start_date, end_date: end_date});
		// // search_results = get_new_patient_bps_by_dt.data;					
		// // } else if (selectedOptionValue == 'Pending') {
		// // await get_pending_patient_bps_by_dt.run({start_date: start_date, end_date: end_date});
		// // search_results = get_pending_patient_bps_by_dt.data;		
		// // } else if (selectedOptionValue == 'Completed') {
		// // await get_complete_patient_bps_by_dt.run({start_date: start_date, end_date: end_date});
		// // search_results = get_complete_patient_bps_by_dt.data;							
		// // } else if (selectedOptionValue == 'Escalation') {
		// // await get_escal_patient_bps_by_dt.run({start_date: start_date, end_date: end_date});
		// // search_results = get_escal_patient_bps_by_dt.data;						
		// // } else if (selectedOptionValue == 'Reinvestigation') {					
		// // await get_reinvest_patient_bps_by_dt.run({start_date: start_date, end_date: end_date});
		// // search_results = get_reinvest_patient_bps_by_dt.data;						
		// // } 
		// // //await get_patients_by_enrollment_dt.run({start_date: start_date, end_date: end_date});
		// // //search_results = get_patients_by_enrollment_dt.data;
		// // } else {
		// // if (selectedOptionValue === "member_id") {
		// // try {
		// // //const res = await get_patient_by_member_id.run({member_id: inputText});
		// // search_results.push(res);
		// // } catch (err) {
		// // showAlert("No patients found")
		// // return
		// // }
		// // } else {
		// // if (selectedOptionValue === "dob") {
		// // inputText = this.convertDOB(inputText);
		// // }
		// // //search_results = await patient_search_api.run( {selected_option_value: selectedOptionValue, input_text: inputText});	
		// // if (search_results.length === 0) { showAlert("No patients found"); return; }
		// // }
		// // }
		// // don't prompt if refresh
		// if (!is_refresh) showAlert(`${search_results.length} patients found`)			
		// //showAlert(`${search_results.length} patients found, mapping results`)
		// 
		// const mapped_patients = this.map_patients(search_results);
		// //storeValue("mapped_patients", mapped_patients);
		// //return mapped_patients;
		// // storeValue("bps_enrollments", search_results);
		// storeValue("bps_mapped_patients", mapped_patients);
		// return search_results
		// } catch (e) {
		// showAlert(e.message);
		// return [];
		// }
	},	
	convertDOB: (dob) => {
		if (!dob) return null
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
	process_new_enrollment: async (start_date, end_date) => {
		try {
			// clear store to free up memory
			// await clearStore() # need to keep start and end date so don't clear memory

			// start_date = '2023-11-14'
			// end_date = '2023-11-15'
			// start and end dates blank so validate regular lookup
			if (!start_date && !end_date) {
				showAlert("Please enter a start and end date range.")
				return [];
			};

			let search_results = [];

			showAlert("Searching enrollments from " + start_date + " to " + end_date);
			start_date = "'" + start_date.toString() + "'";
			end_date = "'" + end_date.toString() + "'";

			// start_date = '2023-11-14'
			// end_date = '2023-11-15'			
			storeValue('enrollment_start_date', start_date);
			storeValue('enrollment_end_date', end_date);

			await get_patients_by_enrollment_dt.run({start_date: start_date, end_date: end_date});
			search_results = await get_patients_by_enrollment_dt.data;

			if (search_results.length == 0) {
				showAlert(`${search_results.length} patients found`)
				return
			}

			showAlert(`${search_results.length} patients found, mapping results`)

			await get_all_bps_patient_ids.run()
			await get_all_bps_member_ids.run()
			let existing_patient_ids = await get_all_bps_patient_ids.data.map(d => d.patient_id)
			let existing_member_ids = await get_all_bps_member_ids.data.map(d => d.member_id)

			let bps_enrollments = []
			let n = 1
			for(let i=0; i < search_results.length; i++) {
				const res = search_results[i]
				// const enrollment_data = res?.enrollment_data || {}
				const enrollment_data = JSON.parse(res?.enrollment_data || "{}")
				const drug_patient = res?.drug_patient || ""
				console.log(enrollment_data)
				const commercial_insurance = enrollment_data?.commercial_insurance || "{}"
				const verification_data = JSON.parse(res?.verification_data || "{}")
				console.log(verification_data)
				const patient_id = parseInt(res?.patient_id) || ""
				let at_risk_for_map_aap = ""
				const original_enrollment_date_drug = res?.original_enrollment_date_drug || ""
				let segmentation_status = "New"
				let maximizer_program_name = ""
				const maximizer = ""
				const flag = ""
				const values_to_check = ""
				const coinsurance = ""
				const member_id = res?.member_id || ""
				const first_name = res?.first_name_v || ""
				const last_name = res?.last_name_v || ""
				const dob = this.convertDOB(res?.date_of_birth_v || "") 
				const zip = String(res?.zip_code_v) || ""
				console.log(zip)

				const enrollment_status = res?.enrollment_status || ""
				const enrollment_source = res?.enrollment_source || ""
				const rx_insurance_name = commercial_insurance?.rx_insurance?.name || ""
				const plan_bin = String(commercial_insurance?.rx_insurance?.bin) || ""	
				const plan_pcn = String(commercial_insurance?.rx_insurance?.pcn) || ""
				const plan_group = String(commercial_insurance?.rx_insurance?.group_number) || ""
				const date_new_status =  this.convertDOB(Date.now())
				const date_pending_status = null
				const date_completed_status = null
				const date_escalation_status = null
				const date_reinvestigation_status = null
				const user_new_status = appsmith.user.username || ""
				const user_pending_status = "" // appsmith.user.username || ""
				const user_completed_status = "" // appsmith.user.username || ""
				const user_escalation_status = "" // appsmith.user.username || ""
				const user_reinvestigation_status = "" // appsmith.user.username || ""



				//const last_date_of_service = null
				// console.log("enrollment data " + enrollment_data)
				console.log(JSON.stringify(res))
				console.log(JSON.stringify(enrollment_data))
				storeValue("patient_id", patient_id)
				storeValue("at_risk_for_map_aap",at_risk_for_map_aap)
				storeValue("original_enrollment_date_drug",original_enrollment_date_drug)
				storeValue("segmentation_status",segmentation_status)
				storeValue("maximizer",maximizer)
				storeValue("flag",flag)
				storeValue("values_to_check",values_to_check)
				storeValue("coinsurance",coinsurance)
				storeValue("member_id",member_id)
				storeValue("first_name",first_name)
				storeValue("last_name",last_name)
				storeValue("dob",dob)
				storeValue("zip",zip)
				storeValue("enrollment_data",JSON.stringify(enrollment_data))
				storeValue("omni_check_verification_data",JSON.stringify(verification_data))				
				storeValue("enrollment_status",enrollment_status)
				storeValue("enrollment_source",enrollment_source)
				storeValue("rx_insurance_name",rx_insurance_name)
				storeValue("plan_bin",plan_bin)
				storeValue("plan_pcn",plan_pcn)
				storeValue("plan_group",plan_group)
				storeValue("date_new_status",date_new_status)
				storeValue("date_pending_status",date_pending_status)
				storeValue("date_completed_status",date_completed_status)
				storeValue("date_escalation_status",date_escalation_status)
				storeValue("date_reinvestigation_status",date_reinvestigation_status)
				storeValue("user_new_status",user_new_status)
				storeValue("user_pending_status",user_pending_status)
				storeValue("user_completed_status",user_completed_status)
				storeValue("user_escalation_status",user_escalation_status)
				storeValue("user_reinvestigation_status",user_reinvestigation_status)
				storeValue("maximizer_program_name",maximizer_program_name)
				//storeValue("last_date_of_service",last_date_of_service)
				const patient_enrollment_json = {
					"patient_id": patient_id,
					"at_risk_for_map_aap": at_risk_for_map_aap,
					"original_enrollment_date_drug": original_enrollment_date_drug,
					"segmentation_status": segmentation_status,
					"maximizer": maximizer,
					"flag": flag,
					"values_to_check": values_to_check,
					"coinsurance": coinsurance,
					"member_id": member_id,
					"first_name": first_name,
					"last_name": last_name,
					"dob": dob,
					"zip": zip,
					"enrollment_data": JSON.stringify(enrollment_data),
					"omni_check_verification_data": JSON.stringify(verification_data),									
					"enrollment_status": enrollment_status,
					"enrollment_source": enrollment_source,
					"rx_insurance_name": rx_insurance_name,
					"plan_bin": plan_bin,
					"plan_pcn": plan_pcn,
					"plan_group": plan_group,
					"date_new_status": date_new_status,
					"date_pending_status": date_pending_status,
					"date_completed_status": date_completed_status,
					"date_escalation_status": date_escalation_status,
					"date_reinvestigation_status": date_reinvestigation_status,
					"user_new_status": user_new_status,
					"user_pending_status": user_pending_status,
					"user_completed_status": user_completed_status,
					"user_escalation_status": user_escalation_status,
					"user_reinvestigation_status": user_reinvestigation_status,
					"maximizer_program_name": maximizer_program_name
				}
				await get_patient_bps.run({patient_id: patient_id})	
				// don't add if enrollment matching patient_id exists or if status is duplicate
				if (get_patient_bps.data.length === 0 && enrollment_status != 'Duplicate' && enrollment_status != 'duplicate' && drug_patient == 'Y' && !existing_patient_ids.includes(patient_id) && !existing_member_ids.includes(member_id)) {
					await add_patient_bps_via_params.run(patient_enrollment_json)
					showAlert(`Adding new patient enrollment ${n}: ${first_name} ${last_name}`)
					bps_enrollments.push(patient_enrollment_json)
					existing_patient_ids.push(patient_id)
					existing_member_ids.push(member_id)		
					bps_helper_obj.auto_segment_via_bps_omni_check_api(patient_id, true, false) 
					n++
				}
			}	

			//			if (search_results.length > 0) {
			//				search_results.forEach(function (res) {

			//				const enrollment_data = res?.enrollment_data
			//    		const patient_id = res?.patient_id || ""
			//    		const at_risk_for_map_aap = ""
			//    		const original_enrollment_date_drug = res?.original_enrollment_date_drug || ""
			//    		const segmentation_status = "New"
			//				const maximizer_program_name = ""
			//    		const maximizer = ""
			//    		const flag = ""
			//    		const values_to_check = ""
			//    		const coinsurance = ""
			//    		const member_id = res?.member_id || ""
			//    		const first_name = res?.enrollment_data?.first_name || ""
			//    		const last_name = res?.enrollment_data?.last_name || ""
			//    		const dob = res?.enrollment_data.date_of_birth || ""
			//    		const enrollment_status = res?.enrollment_status || ""
			//    		const enrollment_source = res?.enrollment_source || ""
			//    		const rx_insurance_name = res?.enrollment_data?.rx_insurance?.name || ""
			//    		const plan_bin = res?.enrollment_data?.rx_insurance?.bin || ""	
			//    		const plan_pcn = res?.enrollment_data?.rx_insurance?.pcn || ""
			//    		const plan_group = res?.enrollment_data?.rx_insurance?.group_number || ""
			//    		const date_new_status = null
			//    		const date_pending_status = null
			//    		const date_completed_status = null
			//    		const date_escalation_status = null
			//    		const date_reinvestigation_status = null
			//    		const user_new_status = appsmith.user.username || ""
			//    		const user_pending_status = "" // appsmith.user.username || ""
			//    		const user_completed_status = "" // appsmith.user.username || ""
			//    		const user_escalation_status = "" // appsmith.user.username || ""
			//    		const user_reinvestigation_status = "" // appsmith.user.username || ""
			//				const last_date_of_service = null
			// console.log("enrollment data " + enrollment_data)
			//					console.log(JSON.stringify(res))
			//					console.log(JSON.stringify(enrollment_data))
			//					await get_patient_bps.run({patient_id, patient_id})

			//				})
			//			}
			//const mapped_patients = this.map_patient(search_results);
			//storeValue("mapped_patients", mapped_patients);
			//return mapped_patients;
			// const mapped_enrollments = this.map_patient(bps_enrollments)
			// storeValue("bps_enrollments", mapped_enrollments);
			// return mapped_enrollments
			this.patient_bps_lookup(true, "", "New",  start_date, end_date)
		} catch (e) {
			showAlert(e.message);
			return [];
		}		
	},	
	parse_bps_claims_and_put_into_memory(bps_claims_str) {
		bps_check_history_tbl_bu.selectedRow.submission_json.split(",")
		// showAlert(bps_claims_str)
		const claims = bps_claims_str.split(",")
		const results = [];

		claims.forEach(function (search_result) {
			search_result = JSON.parse(search_result)
			results.push(JSON.stringify({
				"memberId": search_result?.patient_id || "",
				"ndc": search_result?.ndc || "",
				"quantity": search_result?.drug_quantity || "",
				"daysSupply": search_result?.days_supplied || "",
				"initialOutOfPocket": search_result?.initialOutOfPocket || "",
				"dateOfService": search_result?.dateOfService || "",
				"pharmacyName": search_result?.pharmacy_name || "",
				"bin": search_result?.bin || "",
				"calculatedWac": search_result?.wac || "",
			}));
		});

		storeValue("parsed_bps_claims_submission", results)
	},
	add_bps_check: async (patient_id, at_risk_for_mp_aap, at_risk_indicator_1, at_risk_indicator_2, at_risk_indicator_3, program_name_and_phone_number, segmentation_status) => {
		// TODO impletement me

		// const payload = {
		// user_name: appsmith.user.username,
		// patient_id: patient_id,
		// at_risk_for_mp_aap: at_risk_for_mp_aap,
		// at_risk_indicator_1: at_risk_indicator_1,
		// at_risk_indicator_2: at_risk_indicator_2, 
		// at_risk_indicator_3: at_risk_indicator_3,
		// program_name_and_phone_number: program_name_and_phone_number, 
		// // submission_json: submission_json,
		// // response_json: response_json
		// }

		if (!patient_id) {
			showAlert("Please Make Sure Patient is Selected")
			return
		}

		// check using selectedRow since user must highlight patient record
		if (patient_lookup_table.selectedRow["Segmentation Status"] == 'Needs QC') { 
			showAlert("Action Disabled While Segmentation Status is 'Needs QC'")
		}

		// if pending status, only person who put this in pending can add this bps record with exception of a manager 
		if (patient_lookup_table.selectedRow.segmentation_status == 'Pending') {
			if (patient_lookup_table.selectedRow.user_pending_status != appsmith.user.username && appsmith.user.username in permissions_helper_obj.user_permission_level && permissions_helper_obj.user_permission_level[appsmith.user.username] >= 2) {
				showAlert("Action is locked and can only be done by " + patient_lookup_table.selectedRow.user_pending_status  + " or an authorized manager.") 
				return
			}
		}

		if (!at_risk_for_mp_aap || !at_risk_indicator_1) {
			showAlert("At Risk for MP | AAP and At Risk Indicator 1 are both required fields")
			return
		}

		if (at_risk_for_mp_aap == 'Maximizer = Y and AAP = N' && !program_name_and_phone_number) {
			showAlert("Program Name is required when At Risk for MP|AAP is Maximizer = Y and AAP = N")
			return
		}

		let maximizer_update_result = {}

		const bps_payload = {
			user_name: appsmith.user.username,
			patient_id: patient_id,
			at_risk_for_mp_aap: at_risk_for_mp_aap,
			at_risk_indicator_1: at_risk_indicator_1,
			at_risk_indicator_2: at_risk_indicator_2, 
			at_risk_indicator_3: at_risk_indicator_3,
			program_name_and_phone_number: program_name_and_phone_number 
		}

		try {
			// save to history table
			await add_bps_history.run(bps_payload)
			maximizer_update_result["add_bps_history"] = bps_payload
			// add_bps_maximizer_patient			
		} catch(e) {
			showAlert("Error adding record to bps history. Aborting all other updates to Paysign and Main Database. Error message: " + e)
			return		
		}

		// submission_json: submission_json,
		// response_json: response_json			
		const maximizer_program_name = program_name_and_phone_number.split('-')[0]

		// update at_risk_for_mp_aap data fields in bps patient record - making this non-null ensures that ps and main db updates done wehen calling update segmentation status function
		try {
			await update_bps_at_risk_mp_aap.run({patient_id: patient_id, at_risk_for_mp_aap: at_risk_for_mp_aap})			
			maximizer_update_result["at_risk_for_mp_aap"] = at_risk_for_mp_aap
		} catch(e) {
			maximizer_update_result["at_risk_for_mp_aap"] = "Error updating at_risk_for_mp_aap in BPS data table " + e
		}

		// update maximizer_program_name data fields in bps patient record
		try {
			await update_bps_maximizer_program.run({patient_id: patient_id, maximizer_program_name: maximizer_program_name})		
			maximizer_update_result["maximizer_program_name"] = maximizer_program_name
		} catch(e) {
			maximizer_update_result["maximizer_program_name"] = "Error updating maximizer_program_name in BPS data table " + e
		}

		storeValue("patient_id", patient_id)
		// refresh bps history table
		await get_bps_history.run({patient_id: patient_id})

		// await get_bps_check_history.run({patient_id: patient_id})
		try {
			await this.update_segmentation_status(patient_id, patient_lookup_table.selectedRow["Member ID"], segmentation_status, appsmith.user.username)
			maximizer_update_result["segmentation_status"] = segmentation_status
		} catch(e) {
			maximizer_update_result["segmentation_status"] = "Error updating segmentation_status in BPS data table " + e
		}

		// refresh needs QC list
		if (segmentation_status == "Needs QC") get_maximizer_qc_queue.run()

		// refresh patient lookup table too since bps at risk mp | aap updated
		this.patient_bps_lookup(true, segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)

		showAlert("BPS Check Successfully Added")

		// already done as part of update segmentation status
		// if (segmentation_status == 'Completed') {
		// // update maximizer status in main db 
		// try {
		// await update_copay_maximizer_status.run({"patient_id": patient_id, "maximizer_status": 0})
		// showAlert("Successfully updated Main Database Maximizer Status to 0")
		// maximizer_update_result["update_copay_maximizer_status"] = await update_copay_maximizer_status.data
		// } catch (e) {
		// showAlert("Failed to update Main Database Maximizer Status")					
		// maximizer_update_result["update_copay_maximizer_status"] = "Error updating maximizer_status in Main data table " + e
		// }
		// 
		// try {
		// // update maximizer status at ps 
		// await update_patient_member_grp_ps.run({"member_group": "100073A", "member_id": patient_lookup_table.selectedRow["Member ID"]})
		// showAlert("Successfully updated Paysign Member Group to Maximizer")
		// maximizer_update_result["update_patient_member_grp_ps"] = await update_patient_member_grp_ps.data
		// } catch (e) {
		// showAlert("Failed to update Paysign member Group")
		// maximizer_update_result["update_patient_member_grp_ps"] = "Error updating maximizer_status at Paysign using api " + e
		// }
		// 
		// // only log if adding patient as maximizer
		// await log.run({action_type: constants.add_bps_maximizer_patient, ref_id: patient_lookup_table.selectedRow["Member ID"]?.toString() || "", ref_id_type: constants.member_id, change_json: JSON.stringify(maximizer_update_result) })							
		// }

	},
	update_bps_check: async (notes_id, user_name, patient_id, disposition, notes, created) => {
		// TODO: impletement me
		showAlert("Not implemented yet")
		return
		if (!disposition) {
			showAlert("Disposition Cannot Be Blank")
			return;
		}

		if (!patient_id) {
			showAlert("Please Make Sure Provider is Selected")
			return;
		}

		if (!notes_id) {
			showAlert("Please Select Note To Update")
			return;
		}		

		// try {
		// await update_patient_note.run(
		// { notes_id: notes_id,
		// user_name: user_name,
		// patient_id: patient_id,
		// disposition: disposition,
		// notes: notes,
		// created: created
		// });


		// get_patient_notes.run({patient_id: patient_id});
		showAlert("Notes Successfully Updated");	

		// } catch(e) {
		// showAlert("Update Failed " + e.message);			
		// }
	},
	run_claims_bps:  async (patient_id, member_id) => {
		if (!patient_id) {
			showAlert("Please select/highlight a patient in the Patient Lookup Table")
			return
		}
		storeValue("patient_id", patient_id)
		const claims = await get_patient_claims_for_bps.run({patient_id: patient_id})

		if (claims.length === 0) {
			showAlert("INSUFFICIENT CLAIM HISTORY. No PBM Claims found for BPS Determination.")
			at_risk_mp_aap_sel.setSelectedOption(null)
			return
		} else {
			showAlert(`${claims.length} claims found, getting bps results`)
		}
		const results = [];

		claims.forEach(function (search_result) {

			results.push({
				"memberId": search_result?.memberId || "",
				"ndc": search_result?.ndc || "",
				"quantity": search_result?.quantity || "",
				"daysSupply": search_result?.daysSupply || "",
				"initialOutOfPocket": search_result?.initialOutOfPocket || "",
				"dateOfService": search_result?.dateOfService || "",
				"pharmacyName": search_result?.pharmacyName || "",
				"bin": search_result?.bin || "",
				"calculatedWac": search_result?.calculatedWac || "",
			});
		});


		// console.log("get claims for bps result" + results.join(", "))
		// showAlert("get claims for bps result"  + results.join(", "))
		const bps_claims = results.join(", ")

		storeValue("bps_claims", results)
		try {
			await bps_claims_api.run({"member_id": member_id, "claims": results})
			const bps_result = bps_claims_api.data 

			const at_risk_for_mp_aap = bps_result?.At_Risk_for_MP_AAP || ""
			const maximizer_program_name = bps_result?.Maximizer_Program_Name || ""
			const at_risk_indicator_1 = bps_result?.At_Risk_Indicator_1 || ""
			const at_risk_indicator_2 = bps_result?.At_Risk_Indicator_2 || ""
			const flag = bps_result?.flag || ""

			if (at_risk_for_mp_aap == 'Y|N') {
				// - Maximizer Yes | AAP No (Maximizer)
				at_risk_mp_aap_sel.setSelectedOption('Maximizer = Y and AAP = N')

				// await update_bps_at_risk_mp_aap.data.run({at_risk_for_map_aap: at_risk_for_mp_aap})

				// showAlert("BPS Claims Indication as Maximizer Group -> Automatically Change Patient to Maximizer Group via Code")

			} else if (at_risk_for_mp_aap == 'N|Y') {
				// - Maximizer No | AAP Yes (AAP)
				at_risk_mp_aap_sel.setSelectedOption('Maximizer = N and AAP = Y')
			} else if (at_risk_for_mp_aap == 'N|N') {
				// - Maximizer No | AAP No (No Risk)
				at_risk_mp_aap_sel.setSelectedOption('Maximizer = N and AAP = N')
				showAlert("BPS Claims Indication as Standard Group -> Automatically Change Patient to Standard Group via Code")
			} else if (at_risk_for_mp_aap == 'N|U') {
				// - Maximizer No | AAP Unknown
				at_risk_mp_aap_sel.setSelectedOption('Maximizer = N and AAP = U')
			} else if (at_risk_for_mp_aap == 'U|U') {
				// - Maximizer Unknown | AAP Unknown (Unknown)
				at_risk_mp_aap_sel.setSelectedOption('Maximizer = U and AAP = U')
			} else if (at_risk_for_mp_aap == 'NA|NA') {
				// - Maximizer NA | AAP NA (E1 NULL)
				at_risk_mp_aap_sel.setSelectedOption('Maximizer = NA and AAP = NA')
			} else {
				showAlert("At Risk for MP AAP Result does NOT Correspond to a Dropdown Value" + at_risk_for_mp_aap)
			}
			console.log(bps_result.data)
			// showAlert(JSON.toString(bps_result.data))

			const bps_result_json = JSON.stringify(bps_result)
			showAlert(bps_result_json)

			// this.update_at_risk_indicators(at_risk_mp_aap_sel.selectedOptionValue)	

			// save bps checks as completed - is this correct assumption? - no - only store in bps check history
			// await this.add_bps_check(patient_id, at_risk_for_mp_aap, "bpa", "", "", maximizer_program_name, bps_claims, bps_result_json, "Completed")

		} catch (e) {
			showAlert("Error while calling bps api " + JSON.stringify(e))
		}

	},
	update_at_risk_indicators_update_member_group (at_risk_for_maximizer_aap_answer) {
		//	write code here
		//	this.myVar1 = [1,2,3]
		if (at_risk_for_maximizer_aap_answer == 'Maximizer = Y and AAP = N')
		{		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("at_risk_indicator1_update_member_group", 
								 [{
									 "name": "PreVail Keyword Match (MP)",
									 "code": "PreVail Keyword Match (MP)"
								 },
									{
										"name": "PreVail BPG Match (MP)",
										"code": "PreVail BPG Match (MP)"
									},
									{
										"name": "Confirmed by Rep (MP)",
										"code": "Confirmed by Rep (MP)"
									},
									{
										"name": "Confirmed by plan level information (MP)",
										"code": "Confirmed by plan level information (MP)"
									},
									{
										"name": "Payer Portal Message (MP)",
										"code": "Payer Portal Message (MP)"
									},
									{
										"name": "Repeating 30% or 50% coinsurance (MP)",
										"code": "Repeating 30% or 50% coinsurance (MP)"
									},
									{
										"name": "Repeating copay / 12 or 13 (MP)",
										"code": "Repeating copay / 12 or 13 (MP)"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									},
									{
										"name": "Confirmed by historical claims (MP)",
										"code": "Confirmed by historical claims (MP)"
									}])	
			storeValue("at_risk_indicator2_update_member_group", 
								 [{
									 "name": "Payer Portal Message (MP)",
									 "code": "Payer Portal Message (MP)"
								 },
									{
										"name": "Repeating 30% or 50% coinsurance (MP)",
										"code": "Repeating 30% or 50% coinsurance (MP)"
									},
									{
										"name": "Repeating copay / 12 or 13 (MP)",
										"code": "Repeating copay / 12 or 13 (MP)"
									},
									{
										"name": "PreVail Keyword Match (MP)",
										"code": "PreVail Keyword Match (MP)"
									},
									{
										"name": "PreVail BPG Match (MP)",
										"code": "PreVail BPG Match (MP)"
									},
									{
										"name": "Confirmed by plan level information (MP)",
										"code": "Confirmed by plan level information (MP)"
									},
									{
										"name": "Confirmed by historical claims (MP)",
										"code": "Confirmed by historical claims (MP)"
									},
									{
										"name": "At Risk Indicator 1 (when = Maximizer = N and AAP = Y)",
										"code": "At Risk Indicator 1 (when = Maximizer = N and AAP = Y)"
									},
									{
										"name": "Confirmed by plan level information (AAP)",
										"code": "Confirmed by plan level information (AAP)"
									},
									{
										"name": "Confirmed by Rep (AAP)",
										"code": "Confirmed by Rep (AAP)"
									},
									{
										"name": "Patient Responsibility is always the remaining accumulators (AAP)",
										"code": "Patient Responsibility is always the remaining accumulators (AAP)"
									},
									{
										"name": "Patient Responsibility is full cost or full accumulators (AAP)",
										"code": "Patient Responsibility is full cost or full accumulators (AAP)"
									},
									{
										"name": "Only $5 patient responsibility is applying to accumulators (AAP)",
										"code": "Only $5 patient responsibility is applying to accumulators (AAP)"
									},
									{
										"name": "Payer Portal Message (AAP)",
										"code": "Payer Portal Message (AAP)"
									},
									{
										"name": "Confirmed by adjustments to accumulators (AAP)",
										"code": "Confirmed by adjustments to accumulators (AAP)"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									},
									{
										"name": "Confirmed by historical claims (AAP)",
										"code": "Confirmed by historical claims (AAP)"
									},
									{
										"name": "Copayment will not apply towards accumulators (AAP)",
										"code": "Copayment will not apply towards accumulators (AAP)"
									},
									{
										"name": "PreVail BPG Match (AAP)",
										"code": "PreVail BPG Match (AAP)"
									}])
		} else if (at_risk_for_maximizer_aap_answer == 'Maximizer = N and AAP = Y'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1_update_member_group", 
								 [{
									 "name": "Confirmed by plan level information (AAP)",
									 "code": "Confirmed by plan level information (AAP)"
								 },
									{
										"name": "Confirmed by Rep (AAP)",
										"code": "Confirmed by Rep (AAP)"
									},
									{
										"name": "Patient Responsibility is always the remaining accumulators (AAP)",
										"code": "Patient Responsibility is always the remaining accumulators (AAP)"
									},
									{
										"name": "Patient Responsibility is full cost or full accumulators (AAP)",
										"code": "Patient Responsibility is full cost or full accumulators (AAP)"
									},
									{
										"name": "Only $5 patient responsibility is applying to accumulators (AAP)",
										"code": "Only $5 patient responsibility is applying to accumulators (AAP)"
									},
									{
										"name": "Payer Portal Message (AAP) § Confirmed by adjustments to accumulators (AAP)",
										"code": "Payer Portal Message (AAP) § Confirmed by adjustments to accumulators (AAP)"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									},
									{
										"name": "Confirmed by historical claims (AAP)",
										"code": "Confirmed by historical claims (AAP)"
									},
									{
										"name": "Copayment will not apply towards accumulators (AAP)",
										"code": "Copayment will not apply towards accumulators (AAP)"
									},
									{
										"name": "PreVail BPG Match (AAP)",
										"code": "PreVail BPG Match (AAP)"
									}])	
			storeValue("at_risk_indicator2_update_member_group", 
								 [{
									 "name": "Confirmed by Rep (AAP)",
									 "code": "Confirmed by Rep (AAP)"
								 },
									{
										"name": "Patient Responsibility is full cost or full accumulators (AAP)",
										"code": "Patient Responsibility is full cost or full accumulators (AAP)"
									},
									{
										"name": "Only $5 patient responsibility is applying to accumulators (AAP)",
										"code": "Only $5 patient responsibility is applying to accumulators (AAP)"
									},
									{
										"name": "Paver Portal Message (AAP)",
										"code": "Paver Portal Message (AAP)"
									},
									{
										"name": "High Remaining accumulators (AAP)",
										"code": "High Remaining accumulators (AAP)"
									},
									{
										"name": "Copayment will not apply towards accumulators (AAP)",
										"code": "Copayment will not apply towards accumulators (AAP)"
									},
									{
										"name": "Confirmed by adjustments to accumulators (AAP)",
										"code": "Confirmed by adjustments to accumulators (AAP)"
									},
									{
										"name": "Confirmed by plan level information (AAP)",
										"code": "Confirmed by plan level information (AAP)"
									}])
		} else if  (at_risk_for_maximizer_aap_answer == 'Maximizer = N and AAP = N'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1_update_member_group", 
								 [{
									 "name": "Confirmed by Rep (NO RISK)",
									 "code": "Confirmed by Rep (NO RISK)"
								 },
									{
										"name": "Patient Responsibility < $900 (NO RISK)",
										"code": "Patient Responsibility < $900 (NO RISK)"
									},
									{
										"name": "Accumulators are going down or met (NO RISK)",
										"code": "Accumulators are going down or met (NO RISK)"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied (NO RISK)",
										"code": "Plan Exclusion - Discounted Rate Applied (NO RISK)"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									},
									{
										"name": "Commercial = N (NO RISK)",
										"code": "Commercial = N (NO RISK)"
									},
									{
										"name": "No Risk BIN (NO RISK)",
										"code": "No Risk BIN (NO RISK)"
									},
									{
										"name": "Confirmed by historical claims (NO RISK)",
										"code": "Confirmed by historical claims (NO RISK)"
									},
									{
										"name": "High copay due to Benefit Cap (NO RISK)",
										"code": "High copay due to Benefit Cap (NO RISK)"
									},
									{
										"name": "Confirmed by plan level information (NO RISK)",
										"code": "Confirmed by plan level information (NO RISK)"
									},
									{
										"name": "Patient no longer on therapy (NO RISK)",
										"code": "Patient no longer on therapy (NO RISK)"
									}])	
			storeValue("at_risk_indicator2_update_member_group", 
								 [{
									 "name": "OmniCheck Not Found (NO RISK)",
									 "code": "OmniCheck Not Found (NO RISK)"
								 },
									{
										"name": "Patient Responsibility < $900 (NO RISK)",
										"code": "Patient Responsibility < $900 (NO RISK)"
									},
									{
										"name": "Accumulators are going down or met (NO RISK)",
										"code": "Accumulators are going down or met (NO RISK)"
									},
									{
										"name": "Need more claims (NO RISK)",
										"code": "Need more claims (NO RISK)"
									},
									{
										"name": "Test Claim Not Available or PA Required (NO RISK)",
										"code": "Test Claim Not Available or PA Required (NO RISK)"
									},
									{
										"name": "Grace Fill (NO RISK)",
										"code": "Grace Fill (NO RISK)"
									},
									{
										"name": "Out of Network Penalty (NO RISK)",
										"code": "Out of Network Penalty (NO RISK)"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied (NO RISK)",
										"code": "Plan Exclusion - Discounted Rate Applied (NO RISK)"
									},
									{
										"name": "Discount Card was used (NO RISK)",
										"code": "Discount Card was used (NO RISK)"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical (NO RISK)",
										"code": "Indemnity Plan or reimbursed through Major Medical (NO RISK)"
									},
									{
										"name": "Commercial = N (NO RISK)",
										"code": "Commercial = N (NO RISK)"
									},
									{
										"name": "No Risk BIN (NO RISK)",
										"code": "No Risk BIN (NO RISK)"
									}])

		} else if  (at_risk_for_maximizer_aap_answer == 'Maximizer = N and AAP = U'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1_update_member_group", 
								 [{
									 "name": "Need more claims",
									 "code": "Need more claims"
								 },
									{
										"name": "Test Claim Not Available or PA Required",
										"code": "Test Claim Not Available or PA Required"
									},
									{
										"name": "Grace Fill",
										"code": "Grace Fill"
									},
									{
										"name": "Out of Network Penalty",
										"code": "Out of Network Penalty"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied",
										"code": "Plan Exclusion - Discounted Rate Applied"
									},
									{
										"name": "Discount Card was used",
										"code": "Discount Card was used"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical",
										"code": "Indemnity Plan or reimbursed through Major Medical"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									}])	
			storeValue("at_risk_indicator2_update_member_group", 
								 [{
									 "name": "OmniCheck Not Found (NO RISK)",
									 "code": "OmniCheck Not Found (NO RISK)"
								 },
									{
										"name": "Patient Responsibility < $900 (NO RISK)",
										"code": "Patient Responsibility < $900 (NO RISK)"
									},
									{
										"name": "Accumulators are going down or met (NO RISK)",
										"code": "Accumulators are going down or met (NO RISK)"
									},
									{
										"name": "Need more claims (NO RISK)",
										"code": "Need more claims (NO RISK)"
									},
									{
										"name": "Test Claim Not Available or PA Required (NO RISK)",
										"code": "Test Claim Not Available or PA Required (NO RISK)"
									},
									{
										"name": "Grace Fill (NO RISK)",
										"code": "Grace Fill (NO RISK)"
									},
									{
										"name": "Out of Network Penalty (NO RISK)",
										"code": "Out of Network Penalty (NO RISK)"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied (NO RISK)",
										"code": "Plan Exclusion - Discounted Rate Applied (NO RISK)"
									},
									{
										"name": "Discount Card was used (NO RISK)",
										"code": "Discount Card was used (NO RISK)"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical (NO RISK)",
										"code": "Indemnity Plan or reimbursed through Major Medical (NO RISK)"
									},
									{
										"name": "Commercial = N (NO RISK)",
										"code": "Commercial = N (NO RISK)"
									},
									{
										"name": "No Risk BIN (NO RISK)",
										"code": "No Risk BIN (NO RISK)"
									}])
		} else if  (at_risk_for_maximizer_aap_answer == 'Maximizer = U and AAP = U'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1", 
								 [{
									 "name": "Need more claims",
									 "code": "Need more claims"
								 },
									{
										"name": "Test Claim Not Available or PA Required",
										"code": "Test Claim Not Available or PA Required"
									},
									{
										"name": "Grace Fill",
										"code": "Grace Fill"
									},
									{
										"name": "Out of Network Penalty",
										"code": "Out of Network Penalty"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied",
										"code": "Plan Exclusion - Discounted Rate Applied"
									},
									{
										"name": "Discount Card was used",
										"code": "Discount Card was used"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical",
										"code": "Indemnity Plan or reimbursed through Major Medical"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									}])	
			storeValue("at_risk_indicator2", 
								 [{
									 "name": "OmniCheck Not Found (NO RISK)",
									 "code": "OmniCheck Not Found (NO RISK)"
								 },
									{
										"name": "Patient Responsibility < $900 (NO RISK)",
										"code": "Patient Responsibility < $900 (NO RISK)"
									},
									{
										"name": "Accumulators are going down or met (NO RISK)",
										"code": "Accumulators are going down or met (NO RISK)"
									},
									{
										"name": "Need more claims (NO RISK)",
										"code": "Need more claims (NO RISK)"
									},
									{
										"name": "Test Claim Not Available or PA Required (NO RISK)",
										"code": "Test Claim Not Available or PA Required (NO RISK)"
									},
									{
										"name": "Grace Fill (NO RISK)",
										"code": "Grace Fill (NO RISK)"
									},
									{
										"name": "Out of Network Penalty (NO RISK)",
										"code": "Out of Network Penalty (NO RISK)"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied (NO RISK)",
										"code": "Plan Exclusion - Discounted Rate Applied (NO RISK)"
									},
									{
										"name": "Discount Card was used (NO RISK)",
										"code": "Discount Card was used (NO RISK)"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical (NO RISK)",
										"code": "Indemnity Plan or reimbursed through Major Medical (NO RISK)"
									},
									{
										"name": "Commercial = N (NO RISK)",
										"code": "Commercial = N (NO RISK)"
									},
									{
										"name": "No Risk BIN (NO RISK)",
										"code": "No Risk BIN (NO RISK)"
									}])
		} else if  (at_risk_for_maximizer_aap_answer == 'Maximizer = NA and AAP = NA'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1", 
								 [{
									 "name": "E1 Not Found (NULL)",
									 "code": "E1 Not Found (NULL)"
								 },
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									}])	
			storeValue("at_risk_indicator2", 
								 [])	
		} else {
			storeValue("hide_bps_complete", false)
			showAlert("Indicator Not Determined For Current Selection")
			storeValue("at_risk_indicator1", 
								 [])	
			storeValue("at_risk_indicator2", 
								 [])	
		}
	}, 
	update_at_risk_indicators (at_risk_for_maximizer_aap_answer) {
		//	write code here
		//	this.myVar1 = [1,2,3]
		if (at_risk_for_maximizer_aap_answer == 'Maximizer = Y and AAP = N') {		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", true)
			storeValue("at_risk_indicator1", 
								 [{
									 "name": "PreVail Keyword Match (MP)",
									 "code": "PreVail Keyword Match (MP)"
								 },
									{
										"name": "PreVail BPG Match (MP)",
										"code": "PreVail BPG Match (MP)"
									},
									{
										"name": "Confirmed by Rep (MP)",
										"code": "Confirmed by Rep (MP)"
									},
									{
										"name": "Confirmed by plan level information (MP)",
										"code": "Confirmed by plan level information (MP)"
									},
									{
										"name": "Payer Portal Message (MP)",
										"code": "Payer Portal Message (MP)"
									},
									{
										"name": "Repeating 30% or 50% coinsurance (MP)",
										"code": "Repeating 30% or 50% coinsurance (MP)"
									},
									{
										"name": "Repeating copay / 12 or 13 (MP)",
										"code": "Repeating copay / 12 or 13 (MP)"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									},
									{
										"name": "Confirmed by historical claims (MP)",
										"code": "Confirmed by historical claims (MP)"
									}])	
			storeValue("at_risk_indicator2", 
								 [{
									 "name": "Payer Portal Message (MP)",
									 "code": "Payer Portal Message (MP)"
								 },
									{
										"name": "Repeating 30% or 50% coinsurance (MP)",
										"code": "Repeating 30% or 50% coinsurance (MP)"
									},
									{
										"name": "Repeating copay / 12 or 13 (MP)",
										"code": "Repeating copay / 12 or 13 (MP)"
									},
									{
										"name": "PreVail Keyword Match (MP)",
										"code": "PreVail Keyword Match (MP)"
									},
									{
										"name": "PreVail BPG Match (MP)",
										"code": "PreVail BPG Match (MP)"
									},
									{
										"name": "Confirmed by plan level information (MP)",
										"code": "Confirmed by plan level information (MP)"
									},
									{
										"name": "Confirmed by historical claims (MP)",
										"code": "Confirmed by historical claims (MP)"
									},
									{
										"name": "At Risk Indicator 1 (when = Maximizer = N and AAP = Y)",
										"code": "At Risk Indicator 1 (when = Maximizer = N and AAP = Y)"
									},
									{
										"name": "Confirmed by plan level information (AAP)",
										"code": "Confirmed by plan level information (AAP)"
									},
									{
										"name": "Confirmed by Rep (AAP)",
										"code": "Confirmed by Rep (AAP)"
									},
									{
										"name": "Patient Responsibility is always the remaining accumulators (AAP)",
										"code": "Patient Responsibility is always the remaining accumulators (AAP)"
									},
									{
										"name": "Patient Responsibility is full cost or full accumulators (AAP)",
										"code": "Patient Responsibility is full cost or full accumulators (AAP)"
									},
									{
										"name": "Only $5 patient responsibility is applying to accumulators (AAP)",
										"code": "Only $5 patient responsibility is applying to accumulators (AAP)"
									},
									{
										"name": "Payer Portal Message (AAP)",
										"code": "Payer Portal Message (AAP)"
									},
									{
										"name": "Confirmed by adjustments to accumulators (AAP)",
										"code": "Confirmed by adjustments to accumulators (AAP)"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									},
									{
										"name": "Confirmed by historical claims (AAP)",
										"code": "Confirmed by historical claims (AAP)"
									},
									{
										"name": "Copayment will not apply towards accumulators (AAP)",
										"code": "Copayment will not apply towards accumulators (AAP)"
									},
									{
										"name": "PreVail BPG Match (AAP)",
										"code": "PreVail BPG Match (AAP)"
									}])
		} else if (at_risk_for_maximizer_aap_answer == 'Maximizer = N and AAP = Y'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1", 
								 [{
									 "name": "Confirmed by plan level information (AAP)",
									 "code": "Confirmed by plan level information (AAP)"
								 },
									{
										"name": "Confirmed by Rep (AAP)",
										"code": "Confirmed by Rep (AAP)"
									},
									{
										"name": "Patient Responsibility is always the remaining accumulators (AAP)",
										"code": "Patient Responsibility is always the remaining accumulators (AAP)"
									},
									{
										"name": "Patient Responsibility is full cost or full accumulators (AAP)",
										"code": "Patient Responsibility is full cost or full accumulators (AAP)"
									},
									{
										"name": "Only $5 patient responsibility is applying to accumulators (AAP)",
										"code": "Only $5 patient responsibility is applying to accumulators (AAP)"
									},
									{
										"name": "Payer Portal Message (AAP) § Confirmed by adjustments to accumulators (AAP)",
										"code": "Payer Portal Message (AAP) § Confirmed by adjustments to accumulators (AAP)"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									},
									{
										"name": "Confirmed by historical claims (AAP)",
										"code": "Confirmed by historical claims (AAP)"
									},
									{
										"name": "Copayment will not apply towards accumulators (AAP)",
										"code": "Copayment will not apply towards accumulators (AAP)"
									},
									{
										"name": "PreVail BPG Match (AAP)",
										"code": "PreVail BPG Match (AAP)"
									}])	
			storeValue("at_risk_indicator2", 
								 [{
									 "name": "Confirmed by Rep (AAP)",
									 "code": "Confirmed by Rep (AAP)"
								 },
									{
										"name": "Patient Responsibility is full cost or full accumulators (AAP)",
										"code": "Patient Responsibility is full cost or full accumulators (AAP)"
									},
									{
										"name": "Only $5 patient responsibility is applying to accumulators (AAP)",
										"code": "Only $5 patient responsibility is applying to accumulators (AAP)"
									},
									{
										"name": "Paver Portal Message (AAP)",
										"code": "Paver Portal Message (AAP)"
									},
									{
										"name": "High Remaining accumulators (AAP)",
										"code": "High Remaining accumulators (AAP)"
									},
									{
										"name": "Copayment will not apply towards accumulators (AAP)",
										"code": "Copayment will not apply towards accumulators (AAP)"
									},
									{
										"name": "Confirmed by adjustments to accumulators (AAP)",
										"code": "Confirmed by adjustments to accumulators (AAP)"
									},
									{
										"name": "Confirmed by plan level information (AAP)",
										"code": "Confirmed by plan level information (AAP)"
									}])
		} else if  (at_risk_for_maximizer_aap_answer == 'Maximizer = N and AAP = N'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1", 
								 [{
									 "name": "Confirmed by Rep (NO RISK)",
									 "code": "Confirmed by Rep (NO RISK)"
								 },
									{
										"name": "Patient Responsibility < $900 (NO RISK)",
										"code": "Patient Responsibility < $900 (NO RISK)"
									},
									{
										"name": "Accumulators are going down or met (NO RISK)",
										"code": "Accumulators are going down or met (NO RISK)"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied (NO RISK)",
										"code": "Plan Exclusion - Discounted Rate Applied (NO RISK)"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									},
									{
										"name": "Commercial = N (NO RISK)",
										"code": "Commercial = N (NO RISK)"
									},
									{
										"name": "No Risk BIN (NO RISK)",
										"code": "No Risk BIN (NO RISK)"
									},
									{
										"name": "Confirmed by historical claims (NO RISK)",
										"code": "Confirmed by historical claims (NO RISK)"
									},
									{
										"name": "High copay due to Benefit Cap (NO RISK)",
										"code": "High copay due to Benefit Cap (NO RISK)"
									},
									{
										"name": "Confirmed by plan level information (NO RISK)",
										"code": "Confirmed by plan level information (NO RISK)"
									},
									{
										"name": "Patient no longer on therapy (NO RISK)",
										"code": "Patient no longer on therapy (NO RISK)"
									}])	
			storeValue("at_risk_indicator2", 
								 [{
									 "name": "OmniCheck Not Found (NO RISK)",
									 "code": "OmniCheck Not Found (NO RISK)"
								 },
									{
										"name": "Patient Responsibility < $900 (NO RISK)",
										"code": "Patient Responsibility < $900 (NO RISK)"
									},
									{
										"name": "Accumulators are going down or met (NO RISK)",
										"code": "Accumulators are going down or met (NO RISK)"
									},
									{
										"name": "Need more claims (NO RISK)",
										"code": "Need more claims (NO RISK)"
									},
									{
										"name": "Test Claim Not Available or PA Required (NO RISK)",
										"code": "Test Claim Not Available or PA Required (NO RISK)"
									},
									{
										"name": "Grace Fill (NO RISK)",
										"code": "Grace Fill (NO RISK)"
									},
									{
										"name": "Out of Network Penalty (NO RISK)",
										"code": "Out of Network Penalty (NO RISK)"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied (NO RISK)",
										"code": "Plan Exclusion - Discounted Rate Applied (NO RISK)"
									},
									{
										"name": "Discount Card was used (NO RISK)",
										"code": "Discount Card was used (NO RISK)"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical (NO RISK)",
										"code": "Indemnity Plan or reimbursed through Major Medical (NO RISK)"
									},
									{
										"name": "Commercial = N (NO RISK)",
										"code": "Commercial = N (NO RISK)"
									},
									{
										"name": "No Risk BIN (NO RISK)",
										"code": "No Risk BIN (NO RISK)"
									}])

		} else if  (at_risk_for_maximizer_aap_answer == 'Maximizer = N and AAP = U'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1", 
								 [{
									 "name": "Need more claims",
									 "code": "Need more claims"
								 },
									{
										"name": "Test Claim Not Available or PA Required",
										"code": "Test Claim Not Available or PA Required"
									},
									{
										"name": "Grace Fill",
										"code": "Grace Fill"
									},
									{
										"name": "Out of Network Penalty",
										"code": "Out of Network Penalty"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied",
										"code": "Plan Exclusion - Discounted Rate Applied"
									},
									{
										"name": "Discount Card was used",
										"code": "Discount Card was used"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical",
										"code": "Indemnity Plan or reimbursed through Major Medical"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									}])	
			storeValue("at_risk_indicator2", 
								 [{
									 "name": "OmniCheck Not Found (NO RISK)",
									 "code": "OmniCheck Not Found (NO RISK)"
								 },
									{
										"name": "Patient Responsibility < $900 (NO RISK)",
										"code": "Patient Responsibility < $900 (NO RISK)"
									},
									{
										"name": "Accumulators are going down or met (NO RISK)",
										"code": "Accumulators are going down or met (NO RISK)"
									},
									{
										"name": "Need more claims (NO RISK)",
										"code": "Need more claims (NO RISK)"
									},
									{
										"name": "Test Claim Not Available or PA Required (NO RISK)",
										"code": "Test Claim Not Available or PA Required (NO RISK)"
									},
									{
										"name": "Grace Fill (NO RISK)",
										"code": "Grace Fill (NO RISK)"
									},
									{
										"name": "Out of Network Penalty (NO RISK)",
										"code": "Out of Network Penalty (NO RISK)"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied (NO RISK)",
										"code": "Plan Exclusion - Discounted Rate Applied (NO RISK)"
									},
									{
										"name": "Discount Card was used (NO RISK)",
										"code": "Discount Card was used (NO RISK)"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical (NO RISK)",
										"code": "Indemnity Plan or reimbursed through Major Medical (NO RISK)"
									},
									{
										"name": "Commercial = N (NO RISK)",
										"code": "Commercial = N (NO RISK)"
									},
									{
										"name": "No Risk BIN (NO RISK)",
										"code": "No Risk BIN (NO RISK)"
									}])
		} else if  (at_risk_for_maximizer_aap_answer == 'Maximizer = U and AAP = U'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1", 
								 [{
									 "name": "Need more claims",
									 "code": "Need more claims"
								 },
									{
										"name": "Test Claim Not Available or PA Required",
										"code": "Test Claim Not Available or PA Required"
									},
									{
										"name": "Grace Fill",
										"code": "Grace Fill"
									},
									{
										"name": "Out of Network Penalty",
										"code": "Out of Network Penalty"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied",
										"code": "Plan Exclusion - Discounted Rate Applied"
									},
									{
										"name": "Discount Card was used",
										"code": "Discount Card was used"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical",
										"code": "Indemnity Plan or reimbursed through Major Medical"
									},
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									}])	
			storeValue("at_risk_indicator2", 
								 [{
									 "name": "OmniCheck Not Found (NO RISK)",
									 "code": "OmniCheck Not Found (NO RISK)"
								 },
									{
										"name": "Patient Responsibility < $900 (NO RISK)",
										"code": "Patient Responsibility < $900 (NO RISK)"
									},
									{
										"name": "Accumulators are going down or met (NO RISK)",
										"code": "Accumulators are going down or met (NO RISK)"
									},
									{
										"name": "Need more claims (NO RISK)",
										"code": "Need more claims (NO RISK)"
									},
									{
										"name": "Test Claim Not Available or PA Required (NO RISK)",
										"code": "Test Claim Not Available or PA Required (NO RISK)"
									},
									{
										"name": "Grace Fill (NO RISK)",
										"code": "Grace Fill (NO RISK)"
									},
									{
										"name": "Out of Network Penalty (NO RISK)",
										"code": "Out of Network Penalty (NO RISK)"
									},
									{
										"name": "Plan Exclusion - Discounted Rate Applied (NO RISK)",
										"code": "Plan Exclusion - Discounted Rate Applied (NO RISK)"
									},
									{
										"name": "Discount Card was used (NO RISK)",
										"code": "Discount Card was used (NO RISK)"
									},
									{
										"name": "Indemnity Plan or reimbursed through Major Medical (NO RISK)",
										"code": "Indemnity Plan or reimbursed through Major Medical (NO RISK)"
									},
									{
										"name": "Commercial = N (NO RISK)",
										"code": "Commercial = N (NO RISK)"
									},
									{
										"name": "No Risk BIN (NO RISK)",
										"code": "No Risk BIN (NO RISK)"
									}])
		} else if  (at_risk_for_maximizer_aap_answer == 'Maximizer = NA and AAP = NA'){		
			showAlert(at_risk_for_maximizer_aap_answer)
			storeValue("hide_bps_complete", false)
			storeValue("at_risk_indicator1", 
								 [{
									 "name": "E1 Not Found (NULL)",
									 "code": "E1 Not Found (NULL)"
								 },
									{
										"name": "OTHER (Please fill out At Risk Indicator 3)",
										"code": "OTHER (Please fill out At Risk Indicator 3)"
									}])	
			storeValue("at_risk_indicator2", 
								 [])	
		} else {
			if (!at_risk_for_maximizer_aap_answer) {
				storeValue("hide_bps_complete", false)
				storeValue("at_risk_indicator1", 
									 [])	
				storeValue("at_risk_indicator2", 
									 [])					
			} else {
				storeValue("hide_bps_complete", false)
				showAlert("Indicator Not Determined For Current Selection: " + at_risk_for_maximizer_aap_answer)
				storeValue("at_risk_indicator1", 
									 [])	
				storeValue("at_risk_indicator2", 
									 [])					
			}

		}
	},
	update_patient_member_group: async (patient_id, member_id, member_group) => {
		if (!patient_id) {
			showAlert("Patient ID is missing. Please select and highlight patient in patient lookup table first");
		}
		if (!member_id) {
			showAlert("Member ID is missing. Please select and highlight patient in patient lookup table first");
		}		
		if (!member_group) {
			showAlert("Please select a member group to update to");
		}
		const disposition = "Need to change segmentation"
		let maximizer_patient
		let at_risk_for_mp_aap
		let at_risk_indicator_1 
		let program_name_and_phone_number
		let maximizer_update_result = {}		
		// if maximizer, need to ensure
		if (member_group.includes("A") || member_group.includes("a")) {
			// maximizer 
			if (!bps_program_phone_number_selCopy.selectedOptionValue) {
				showAlert("Program Name and Phone Number required.")
				return				
			}
			program_name_and_phone_number = bps_program_phone_number_selCopy.selectedOptionValue
			maximizer_patient = 0 // maximizer
			at_risk_for_mp_aap = "Maximizer = Y and AAP = N"
		} else {
			// non-maximizer (standard)
			if (!non_max_at_risk_mp_aap_sel.selectedOptionValue) {
				showAlert("At Risk MP AAP required.")
				return
			}
			program_name_and_phone_number = ""
			maximizer_patient = 1 // non maximizer
			at_risk_for_mp_aap = non_max_at_risk_mp_aap_sel.selectedOptionValue
		}
		// required for both
		if (!non_max_at_risk_indicator1_sel.selectedOptionValue) {
			showAlert("At Risk Indicator 1 required.")
			return
		}	else {
			at_risk_indicator_1 = non_max_at_risk_indicator1_sel.selectedOptionValue
		}

		if (!member_group_change_notes_inp.text) {
			showAlert("Segmentation note required.")
			return
		}		

		// // add bps check will add bps history, update program names and segmentation status, and updates at ps and main db 
		// bps_helper_obj.add_bps_check(patient_id, at_risk_for_mp_aap, non_max_at_risk_indicator1_sel.selectedOptionValue, "", "", program_name_and_phone_number, "Completed")

		// update to PS and main db done to update segmentation status
		// try {
		// // update at PS
		// await update_patient_member_grp_ps.run({member_id: member_id ,member_group: member_group});
		// showAlert('Patient Member Group Successfully Updated at Paysign');	
		// 
		// } catch (e) {
		// if (update_patient_member_grp_ps.data?.message == 'No subgroup change detected.') {
		// showAlert(member_id + " No change in member group detected.  Patient already in Paysign member Group " + member_group)	
		// } else {
		// showAlert("Failed to update Paysign member Group.  All other updates aborted.  " + update_patient_member_grp_ps.data)
		// return
		// }
		// }
		// 
		// try {
		// await get_copay_patient_by_mid.run({member_id: member_id})
		// // return get_patient_by_member_id_result
		// 
		// 
		// // check if already maximizer
		// if (get_copay_patient_by_mid.data.length > 0) {
		// // const get_patients_linked_to_prov_id_res = await get_patients_linked_to_prov_id.run()
		// const get_copay_patient_by_mid_data = await get_copay_patient_by_mid.data
		// let already_maximizer = false
		// // console.log(get_patients_linked_to_prov_id_res.length)
		// 
		// let p = get_copay_patient_by_mid_data[0]
		// // let enrollment_data = p?.enrollment_data
		// let enrollment_data_json = JSON.parse(p?.enrollment_data || "{}")
		// // console.log("patient data" + p)
		// // console.log("enrollment_data " + enrollment_data)
		// // console.log("enrollment_data_json " + enrollment_data_json)
		// // console.log("enrollment_data_json.maximizer " + enrollment_data_json["maximizer"])						
		// if (enrollment_data_json["maximizer"] === 0) {
		// already_maximizer = true
		// }
		// 
		// if(already_maximizer) {
		// showAlert("Patient already marked in Main Database as " + maximizer_patient.toString())
		// } else {
		// try {
		// await update_copay_maximizer_status.run({patient_id: patient_id, maximizer_patient: maximizer_patient})
		// showAlert("Successfully updated Main Database Maximizer Status to " + maximizer_patient.toString())
		// 
		// } catch (e) {
		// showAlert(`Error updating maximizer status in main Database. ${update_copay_maximizer_status.data}`);			
		// 
		// }						
		// }
		// } else {
		// 
		// showAlert("Patient not found " + get_copay_patient_by_mid.data)
		// }				

		const maximizer_program_name = bps_program_phone_number_selCopy.selectedOptionValue.split('-')[0]

		// update at_risk_for_mp_aap data fields in bps patient record 
		// making this non-null ensures that ps and main db updates done wehen calling update segmentation status 

		// update at_risk_for_mp_aap data fields in bps patient record
		try {
			await update_bps_at_risk_mp_aap.run({patient_id: patient_id, at_risk_for_mp_aap: at_risk_for_mp_aap})
			maximizer_update_result["at_risk_for_mp_aap"] = at_risk_for_mp_aap
			// showAlert("Successfully updated At Risk MP | AAP")				
		} catch(e) {
			showAlert("Failed to update At Risk MP | AAP " + update_bps_at_risk_mp_aap.data)
			maximizer_update_result["at_risk_for_mp_aap"] = "Error updating at_risk_for_mp_aap in BPS data table " + update_bps_at_risk_mp_aap.data
		}

		if (member_group.includes("A") || member_group.includes("a")) { 
			// only update if maximizer 			
			// update maximizer_program_name data fields in bps patient record
			try {
				await update_bps_maximizer_program.run({patient_id: patient_id, maximizer_program_name: maximizer_program_name})		
				maximizer_update_result["maximizer_program_name"] = maximizer_program_name
			} catch(e) {
				showAlert("Failed to update Program Name " + update_bps_maximizer_program.data)
				maximizer_update_result["maximizer_program_name"] = "Error updating maximizer_program_name in BPS data table " + update_bps_maximizer_program.data
			}
		} else {
			// can add code to blank if non-maximizer
		}


		// await get_bps_check_history.run({patient_id: patient_id})

		// update_segmentation_status will update ps and main db if at_risk_for_mp_aap filled in db
		await this.update_segmentation_status(patient_id, member_id, "Completed", appsmith.user.username, true)


		// ADD BPS HISTORY 
		const bps_payload = {
			user_name: appsmith.user.username,
			patient_id: patient_id,
			at_risk_for_mp_aap: at_risk_for_mp_aap,
			at_risk_indicator_1: at_risk_indicator_1,
			at_risk_indicator_2: "", 
			at_risk_indicator_3: "",
			program_name_and_phone_number: program_name_and_phone_number 
		}

		try {
			// save to history table
			await add_bps_history.run(bps_payload)
			maximizer_update_result["add_bps_history"] = bps_payload
			// add_bps_maximizer_patient			
		} catch(e) {
			showAlert("Error adding record to bps history: " + add_bps_history.data)
			maximizer_update_result["add_bps_history"] = "Error adding record to bps history: " + add_bps_history.data
		}

		// submission_json: submission_json,
		// response_json: response_json			
		try {
			// add notes 
			await notes_helper_obj.add_bps_note( appsmith.user.username, patient_id, disposition, member_group_change_notes_inp.text, new Date().toISOString().replace(/T/, ' ').replace(/Z/, ''), true)		
			maximizer_update_result["add_bps_note"] = disposition + " " + member_group_change_notes_inp.text
		} catch(e) {
			maximizer_update_result["add_bps_note"] = "Error adding record to bps history: " + add_bps_note.data
		}




		// storeValue("patient_id", patient_id)
		// refresh bps history table
		get_bps_history.run({patient_id: patient_id})



		// // refresh patient lookup table too since bps at risk mp | aap updated
		// this.patient_bps_lookup(true, segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)



		// *************

		await log.run({action_type: constants.update_patient_member_group + " " + member_group, ref_id: member_id, ref_id_type: constants.member_id, change_json: JSON.stringify(update_patient_member_grp_ps.data) })	
		// if (appsmith.store.last_search_type == "text_and_type") {
		// // refresh for patient lookup table
		// 
		// bps_helper_obj.patient_bps_lookup(true, patient_lookup_txt.text, patient_lookup_list.selectedOptionValue, "", "")
		// } else {
		// this.patient_bps_lookup(true, "", segmentation_status_sel.selectedOptionValue, appsmith.store.start_date, appsmith.store.end_date)
		// }
		get_bps_history.run({patient_id: patient_id})
		get_bps_notes.run({patient_id: patient_id})
		closeModal('mdlUpdateMemberGroup')
		// } catch(e) {
		// showAlert("Could not find member id " + member_id)
		// console.log(JSON.stringify(e))
		// return
		// 
		// }


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

}