export default {
	get_mapped_patient_enrollments: async (patient_list) => {
		try {
			const patient_enrollments = patient_list.map((patient) => {
				const enrollment_data = JSON.parse(patient?.enrollment_data || "{}");
				let patient_provider_data = JSON.parse(patient?.patient_provider_data || "{}");
				if (Object.keys(patient_provider_data).includes("primary")) patient_provider_data = patient_provider_data.primary;
				const provider_data = JSON.parse(patient?.provider_data || "{}");
				const is_old_enrollment = new Date(patient?.enrollment_date || "") < new Date("2023-05-11");
				const is_eligible = patient.patient_status === "Active" || patient.patient_status === "Eligible"
				let patient_age = patient_enrollment_report_func.get_age(enrollment_data?.dob || "")
				if (isNaN(patient_age)) patient_age = "#N/A"
				let benefit_year = patient_enrollment_report_func.get_benefit_year(enrollment_data?.original_enrollment_date || "")
				if (isNaN(benefit_year)) benefit_year = "#N/A"
				let provider_name = ((patient_provider_data?.first_name?.concat(" ") || "") + (patient_provider_data?.fast_name || "") + (patient_provider_data?.last_name || "")).trim()
				if (!provider_name) provider_name = "#N/A"
				let provider_npi = patient_enrollment_report_func.get_patient_provider_npi(patient_provider_data, provider_data)
				if (provider_npi.includes("<a")) provider_npi = provider_npi.substring(provider_npi.indexOf(">") + 1, provider_npi.lastIndexOf("<"))
				let transition_id = patient?.prior_member_id
				if (!transition_id || transition_id === "null") transition_id = "#N/A"
				
				return {
					"card_id": patient?.member_id || "#N/A",
					"master_patient_card_id": "#N/A",
					"transition_id": transition_id,
					"transition_card_id": patient?.patient_id ?? "#N/A",
					"product": "Hemlibra",
					"enrollment_start_date": patient?.enrollment_date || "#N/A",
					"enrollment_end_date": is_eligible ? `${new Date().getFullYear()}-12-31` : patient?.enrollment_date || "#N/A",
					"original_enrollment_date": enrollment_data?.original_enrollment_date || "#N/A",
					"enrollment_channel": "Enrollment Website",
					"enrollment_source": enrollment_data?.enrolled_by || "#N/A",
					"enrollment_status": patient?.patient_status || "#N/A",
					"enrollment_state": is_old_enrollment ? enrollment_data?.address?.state || "#N/A" : enrollment_data?.eligibility?.answer_06 || "#N/A",
					"patient_age": patient_age,
					"patient_gender": enrollment_data?.gender || "#N/A",
					"determination_date": "#N/A",
					"benefit_year": benefit_year,
					"indication": is_old_enrollment ? "#N/A" : enrollment_data?.eligibility?.answer_03 || "#N/A",
					"payer_name_enroll": enrollment_data?.insurance?.medical_insurance?.name || "#N/A",
					"patient_type": patient_age === "#N/A" ? "#N/A" : (patient_age >= 18) ? "Adult" : "Pediatric",
					"genentech_patient_foundation": is_old_enrollment ? "#N/A" : enrollment_data?.eligibility?.answer_07 || "#N/A",
					"private_insurance_check": "Yes",
					"denied_reason": is_eligible ? "#N/A" : enrollment_data?.insurance?.medical_insurance?.plan_type || "#N/A",
					"primary_payer_type": enrollment_data?.insurance?.medical_insurance?.plan_type || "#N/A",
					"monitoring_genentech_patient_foundation" : "Pending Data from GPF Support Vendor",
					"provider_name": provider_name,
					"provider_npi": provider_npi,
					"provider_state": patient_provider_data?.address?.state || "#N/A",
					"provider_address": `${patient_provider_data?.address?.address1 || ""} ${patient_provider_data?.address?.address2 || ""}`.trim() || "#N/A",
					"provider_zip": patient_provider_data?.address?.zip_code?.toString().padStart(5, "0") || "#N/A",
					"provider_city": patient_provider_data?.address?.city || "#N/A",
					"current_balance": (isNaN(patient.current_year_available) || patient.current_year_available === null) ? "#N/A" : patient.current_year_available
				}
			})

			return {patient_enrollments: patient_enrollments}
		} catch (err) {
			console.log(err.toString())

			return {patient_enrollments: []};
		}
	},
	get_patient_enrollments_from_date_range: async(from_date, to_date) => {
		try {
			if (!from_date) {
				showAlert("Please enter a from date.")
				return [];
			} else if (!to_date) {
				showAlert("Please enter a to date.")
				return [];
			}

			let patient_list = await list_patients_api.run();
			const from_date_time = new Date(from_date).getTime()
			const to_date_time = new Date(to_date).getTime()

			patient_list = patient_list.filter((patient) => {
				const patient_enrollment_date_time = new Date(patient?.enrollment_date || "").getTime()
				return patient_enrollment_date_time >= from_date_time && patient_enrollment_date_time <= to_date_time
			})

			return await patient_enrollment_report_func.get_mapped_patient_enrollments(patient_list)
		} catch (err) {

		}
	},
	get_all_patient_enrollments: async() => {
		const patient_list = await list_patients_api.run();
		return await patient_enrollment_report_func.get_mapped_patient_enrollments(patient_list)
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
		if (provider_npi && provider_npi.toString().toLowerCase() !== "null") return provider_npi.toString().padStart(10, "0")
		provider_npi = provider_data?.primary?.npi
		if (provider_npi) return provider_npi.toString().padStart(10, "0")
		provider_npi = provider_data?.secondary?.npi || provider_data?.secondary
		if (Array.isArray(provider_npi)) provider_npi = provider_npi[0]?.npi
		if (provider_npi && typeof provider_npi !== 'object') return provider_npi.toString().padStart(10, "0")
		return "#N/A"
	}
}
