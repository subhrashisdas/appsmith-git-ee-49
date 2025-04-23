export default {
	get_patient_claims: async (from_date, to_date) => {
		try {
			if (!from_date) {
				showAlert("Please enter a from date.")
				return [];
			} else if (!to_date) {
				showAlert("Please enter a to date.")
				return [];
			}

			const patient_claim_api_results = await search_claims_api.run({"from_date_of_service": from_date, "to_date_of_service": to_date});

			const patient_claims = patient_claim_api_results.map((claim) => {
				const claim_data = JSON.parse(claim?.claim_data || "{}")
				const patient_data = JSON.parse(claim_data?.patient_data || "{}")
				const enrollment_data = patient_data?.enrollment_data || {}
				const patient_provider_data = patient_data?.patient_provider_data || {}
				const provider_data = JSON.parse(claim_data?.provider_data || "{}")
				const providers = claim_data?.providers || {}
				const provider = providers?.provider || {}
				const prescriber = providers?.prescriber || {}
				const pharmacy = providers?.pharmacy || {}

				let patient_age = patient_enrollment_report_func.get_age(claim_data?.patient_date_of_birth || enrollment_data?.dob || "")
				if (isNaN(patient_age)) patient_age = "#N/A"
				let transaction_status = claim?.payment_status || ""
				if (transaction_status) transaction_status = transaction_status.charAt(0).toUpperCase() + transaction_status.slice(1).toLowerCase()
				const claim_type = claim?.payment_type?.toUpperCase() || "#N/A"
				let claim_fill_date = "#N/A"
				let date_of_service = "#N/A"
				let claim_submission_date = "#N/A"
				let claim_payment_date = "#N/A"
				let claim_receipt_date = "#N/A"
				let payer_name = "#N/A"
				let payer_plan_number_claim = "#N/A"
				let billing_provider_name = "#N/A"
				let billing_provider_npi = "#N/A"
				let billing_provider_state = "#N/A"
				let billing_provider_address = "#N/A"
				let billing_provider_zip = "#N/A"
				let billing_provider_city = "#N/A"

				if (claim_type === "PBM") {
					claim_fill_date = claim_data?.date_filled || "#N/A"
					date_of_service = claim_data?.date_filled || claim_data?.date_of_service || "#N/A"
					claim_submission_date = claim?.date_of_service || "#N/A"
					claim_payment_date = claim?.date_of_service || "#N/A"
					claim_receipt_date = claim?.date_of_service || "#N/A"
					payer_plan_number_claim = claim_data?.pbm_bin?.toString().padStart(6, "0") || "#N/A"
				}
				else if (claim_type === "CHECK" || claim_type === "DEBIT") {
					claim_fill_date = claim?.date_of_service || "#N/A"
					date_of_service = claim?.date_of_service || "#N/A"
					claim_submission_date = claim_data?.eob_date || "#N/A"
					claim_payment_date = claim_data?.paid_date || "#N/A"
					claim_receipt_date = claim_data?.eob_date || "#N/A"
					payer_name = enrollment_data?.insurance?.medical_insurance?.name || "#N/A"
					billing_provider_name = `${provider?.first_name || ""} ${provider?.last_name || ""}`.trim() || "#N/A",
					billing_provider_npi = provider?.npi?.toString().padStart(10, "0") || "#N/A",
					billing_provider_state = provider?.address?.state || "#N/A",
					billing_provider_address = `${provider?.address?.address1 || ""} ${provider?.address?.address2 || ""}`.trim() || "#N/A",
					billing_provider_zip = provider?.address?.zip?.toString().padStart(5, "0") || "#N/A",
					billing_provider_city = provider?.address?.city || "#N/A"
				}

				return {
					"card_id": claim_data?.member_id || "#N/A",
					"master_patient_card_id": "#N/A",
					"transition_card_id": claim?.patient_id ?? "#N/A",
					"benefit_period": "#N/A",
					"product": "Hemlibra",
					"benefit_year": "#N/A",
					"enrollment_channel": "#N/A",
					"enrollment_source": "#N/A",
					"enrollment_state": "#N/A",
					"enrollment_status": "#N/A",
					"patient_age": patient_age,
					"enrollment_start_date": "#N/A",
					"enrollment_end_date": "#N/A",
					"original_enrollment_date": "#N/A",
					"claim_fill_date": claim_fill_date,
					"date_of_service": date_of_service,
					"claim_submission_date": claim_submission_date,
					"claim_payment_date": claim_payment_date,
					"transaction_status": transaction_status || "#N/A",
					"denial_reason": claim_data?.reject_reason || "#N/A",
					"denial_code": "#N/A",
					"patient_gender": claim_data?.patient_gender || enrollment_data?.gender || "#N/A",
					"payer_name_enroll": payer_name,
					"initial_out_of_pocket": (isNaN(claim_data.out_of_pocket_amount) || claim_data.out_of_pocket_amount === null) ? "#N/A" : claim_data.out_of_pocket_amount,
					"remaining_out_of_pocket": (isNaN(claim_data.patient_responsibility_amount) || claim_data.patient_responsibility_amount === null) ? "#N/A" : claim_data.patient_responsibility_amount,
					"pbm_name": payer_name,
					"claim_receipt_date": claim_receipt_date,
					"claim_type": claim_type,
					"benefit_paid": (isNaN(claim_data.benefit_amount) || claim.benefit_amount === null)  ? "#N/A" : claim_data.benefit_amount,
					"patient_oop": (isNaN(claim_data.patient_responsibility_amount) || claim_data.patient_responsibility_amount === null) ? "#N/A" : claim_data.patient_responsibility_amount,
					"payer_name_claim": payer_name,
					"payer_plan_type_claim": "Pharmacy",
					"payer_plan_number_claim": payer_plan_number_claim,
					"prescriber_first": prescriber?.first_name || "#N/A",
					"prescriber_last": prescriber?.last_name || "#N/A",
					"prescriber_npi": prescriber?.npi?.toString().padStart(10, "0") || "#N/A",
					"prescriber_specialty_1": prescriber?.prescriber_specialty_1 || "#N/A",
					"prescriber_specialty_2": prescriber?.prescriber_specialty_2 || "#N/A",
					"prescriber_state": prescriber?.address?.state || "#N/A",
					"prescriber_city": prescriber?.address?.city || "#N/A",
					"prescriber_zip": prescriber?.address?.zip?.toString().padStart(5, "0") || "#N/A",
					"prescriber_address": `${prescriber?.address?.address1 || ""} ${prescriber?.address?.address2 || ""}`.trim() || "#N/A",
					"pharm_address": `${pharmacy?.address?.address1 || ""} ${pharmacy?.address?.address2 || ""}`.trim() || "#N/A",
					"pharm_city": pharmacy?.address?.city || "#N/A",
					"pharm_state": pharmacy?.address?.state || "#N/A",
					"pharm_zip": pharmacy?.address?.zip?.toString().padStart(5, "0") || "#N/A",
					"pharm_name": pharmacy?.pharmacy_name || "#N/A",
					"claim_reference_number": claim?.claim_id || "#N/A",
					"original_claim_authorization": claim_data?.authorization?.original_claim_authorization || "#N/A",
					"claim_authorization": claim_data?.authorization?.claim_authorization || "#N/A",
					"reversal_claim_authorization": claim_data?.authorization?.reversal_claim_authorization || "#N/A",
					"genentech_patient_foundation": "#N/A",
					"monitoring_genentech_patient_foundation": "#N/A",
					"provider_name": "#N/A",
					"provider_npi": "#N/A",
					"provider_state": "#N/A",
					"provider_address": "#N/A",
					"provider_city": "#N/A",
					"provider_zip": "#N/A",
					"Billing provider_name": billing_provider_name,
					"Billing provider_npi": billing_provider_npi,
					"Billing provider_state": billing_provider_state,
					"Billing provider_address": billing_provider_address,
					"Billing provider_zip": billing_provider_zip,
					"Billing provider_city": billing_provider_city,
					"group_number": claim_data?.group_number || "#N/A",
					"days_supplied": claim_data?.["days supplied"] ?? "",
					"drug_quantity": claim_data?.["drug quantity"] ?? "",
					"ndc": claim_data?.ndc || ""
				}
			})

			return {patient_claims: patient_claims}
		} catch (err) {
			console.log(err.toString())

			return [];
		}
	},
	get_age: (dob_str) => {
		const today = new Date();
		const birth_date = new Date(dob_str);
		let age = today.getFullYear() - birth_date.getFullYear();
		const month_offset = today.getMonth() - birth_date.getMonth();
		if (month_offset < 0 || (month_offset === 0 && today.getDate() < birth_date.getDate())) {
			age--;
		}
		return age;
	},
	get_benefit_year: (original_enrollment_date) => {
		const today = new Date();
		const original_enrollment_year = new Date(original_enrollment_date).getFullYear();
		return today.getFullYear() - original_enrollment_year + 1;
	},
	get_patient_provider_npi: (patient_provider_data, provider_data) => {
		let provider_npi = patient_provider_data?.npi || patient_provider_data?.primary?.npi
		if (provider_npi && provider_npi.toString().toLowerCase() !== "null") return provider_npi
		provider_npi = provider_data?.primary?.npi 
		if (provider_npi) return provider_npi
		provider_npi = provider_data?.secondary?.npi || provider_data?.secondary
		if (Array.isArray(provider_npi)) provider_npi = provider_npi[0]?.npi
		if (provider_npi) return provider_npi
		return "#N/A"
	}
}
