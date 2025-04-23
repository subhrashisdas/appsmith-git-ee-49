export default {
	list_patients_balance: async () => {
		try {
			const list_patients = await list_patients_api.run();
			console.log(list_patients.length);
			console.log(list_patients[0]);

			let all_patients_balance_results;
			all_patients_balance_results = list_patients
			console.log(all_patients_balance_results.length);
			
			let all_patients_balance_response = all_patients_balance_results.map(function (all_patients_balance_results_map) {
				const enrollment_data = JSON.parse(all_patients_balance_results_map?.enrollment_data || "{}");
				return {
					"Previous Member ID": all_patients_balance_results_map?.prior_member_id || "",
					"Current Member ID": all_patients_balance_results_map?.member_id || "",
					"Patient Status": all_patients_balance_results_map?.patient_status || "",
					//"Gender": enrollment_data?.gender || "",
					//"Phone": enrollment_data?.phone || "",
					"2023 Benefit": all_patients_balance_results_map?.total_benefits !== undefined ? all_patients_balance_results_map.total_benefits : "",
					"2023 Benefit Used": all_patients_balance_results_map?.current_year_used !== undefined ? all_patients_balance_results_map.current_year_used : "",
					"2023 Available": all_patients_balance_results_map?.current_year_available !== undefined ? all_patients_balance_results_map.current_year_available : "",
					"2022 Benefit Used": all_patients_balance_results_map?.prior_year_used !== undefined ? all_patients_balance_results_map.prior_year_used : "",
					"2022 Available": all_patients_balance_results_map?.prior_year_available !== undefined ? all_patients_balance_results_map.prior_year_available : "",
					"Enrollment Date": all_patients_balance_results_map?.enrollment_date || "",
					"Database ID": all_patients_balance_results_map.patient_id,
					"First Name": enrollment_data?.first_name || "",
					"Last Name": enrollment_data?.last_name || "",
					"Date of Birth": enrollment_data?.dob || "",
				};
			});
			let response = {
				"all_patients_balance_count": all_patients_balance_results.length,
				"all_patients_balance_results": all_patients_balance_response,
			};
			return response;
		} catch (err) {
			console.log(err);
		}
	}
}