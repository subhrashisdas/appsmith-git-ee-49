export default {

	parse_bps_claims_and_put_into_memory(bps_claims_str) {
		bps_check_history_tbl.selectedRow.submission_json.split(",")
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
	add_bps_check: async (patient_id, at_risk_for_map_aap, at_risk_indicator_1, at_risk_indicator_2, at_risk_indicator_3, program_name_and_phone_number,submission_json, response_json) => {
		// TODO impletement me

		const payload = {
			user_name: appsmith.user.username,
			patient_id: patient_id,
			at_risk_for_map_aap: at_risk_for_map_aap,
			at_risk_indicator_1: at_risk_indicator_1,
			at_risk_indicator_2: at_risk_indicator_2, 
			at_risk_indicator_3: at_risk_indicator_3,
			program_name_and_phone_number: program_name_and_phone_number, 
			submission_json: submission_json,
			response_json: response_json
		}

		if (!patient_id) {
			showAlert("Please Make Sure Patient is Selected")
			return;
		}

		if (!at_risk_for_map_aap || !at_risk_indicator_1) {
			showAlert("At Risk for Map | AAP and At Risk Indicator 1 are both required fields")
			return;
		}

		try {
			await add_bps_check_history.run(
				{
					user_name: appsmith.user.username,
					patient_id: patient_id,
					at_risk_for_map_aap: at_risk_for_map_aap,
					at_risk_indicator_1: at_risk_indicator_1,
					at_risk_indicator_2: at_risk_indicator_2, 
					at_risk_indicator_3: at_risk_indicator_3,
					program_name_and_phone_number: program_name_and_phone_number, 
					submission_json: submission_json,
					response_json: response_json
				});
			get_bps_check_history.run({patient_id: patient_id});
			showAlert("BPS Check Successfully Added");
		} catch(e) {
			showAlert(e);			
		}
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

		try {
			await update_patient_note.run(
				{ notes_id: notes_id,
				 user_name: user_name,
				 patient_id: patient_id,
				 disposition: disposition,
				 notes: notes,
				 created: created
				});


			get_patient_notes.run({patient_id: patient_id});
			showAlert("Notes Successfully Updated");	

		} catch(e) {
			showAlert("Update Failed " + e.message);			
		}
	},

	fill_form_bps_history: async (bps_obj) => {
		// TODO: complete me
	},	

	async run_bps (patient_id) {
		if (!patient_id) {
			showAlert("Please select/highlight a patient in the Patient Lookup Table")
			return
		}
		storeValue("patient_id", patient_id)
		const claims = await get_patient_claims_for_bps.run({patient_id: patient_id})

		if (claims.length === 0) {
			showAlert("No PBM Claims found for BPS Determination")
			at_risk_mp_aap_sel.setSelectedOption(null)
			return
		} else {
			showAlert(`${claims.length} claims found, getting bps results`)
		}
		const results = [];


		claims.forEach(function (search_result) {

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


		// console.log("get claims for bps result" + results.join(", "))
		// showAlert("get claims for bps result"  + results.join(", "))
		const bps_claims = results.join(", ")
		storeValue("bps_claims", bps_claims)
		try {

			await bps_api.run({bps_claims: bps_claims})
			const bps_result = bps_api.data 
			const at_risk_for_mp_aap = bps_result?.At_Risk_for_MP_AAP 
			const maximizer_program_name = bps_result?.Maximizer_Program_Name
			const flag = bps_result?.flag

			if (at_risk_for_mp_aap == 'Y|N') {
				// - Maximizer Yes | AAP No (Maximizer)
				at_risk_mp_aap_sel.setSelectedOption('Maximizer = Y and AAP = N')
				showAlert("BPS Claims Indication as Maximizer Group -> Automatically Change Patient to Maximizer Group via Code")

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
			this.update_at_risk_indicators(at_risk_mp_aap_sel.selectedOptionValue)
			const bps_result_json = JSON.stringify(bps_result)
			await this.add_bps_check(patient_id, at_risk_for_mp_aap, "bpa", "", "", maximizer_program_name, bps_claims, bps_result_json)

		} catch (e) {
			showAlert("Error while calling bps api " + JSON.stringify(e))
		}

	},
	update_at_risk_indicators (at_risk_for_maximizer_aap_answer) {
		//	write code here
		//	this.myVar1 = [1,2,3]
		if (at_risk_for_maximizer_aap_answer == 'Maximizer = Y and AAP = N')
		{		
			showAlert(at_risk_for_maximizer_aap_answer)
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
			showAlert("Indicator Not Determined For Current Selection")
			storeValue("at_risk_indicator1", 
								 [])	
			storeValue("at_risk_indicator2", 
								 [])	
		}
	},
	async myFun2 () {
		//	use async-await or promises
		//	await storeValue('varName', 'hello world')
	}
}