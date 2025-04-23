export default {
	update_max_benefit_tracker: async () => {
		try {
			const list_patients = await list_patients_api.run();
			console.log(list_patients.length);
			console.log(list_patients[0]);

			let approaching_max_benefit_results;
			approaching_max_benefit_results = list_patients.filter(element => {
				return element.current_year_available > 0 && element.current_year_available <= 4500;
			});
			console.log(approaching_max_benefit_results.length);
			let approaching_max_benefit_response = approaching_max_benefit_results.map(function (approaching_max_benefit_results_map) {
				const enrollment_data = JSON.parse(approaching_max_benefit_results_map?.enrollment_data || "{}");
				return {
					"Previous Member ID": approaching_max_benefit_results_map?.prior_member_id || "",
					"Current Member ID": approaching_max_benefit_results_map?.member_id || "",
					"Enrollment Date": approaching_max_benefit_results_map?.enrollment_date || "",
					"First Name": enrollment_data?.first_name || "",
					"Last Name": enrollment_data?.last_name || "",
					"Date of Birth": enrollment_data?.dob || "",
					"Gender": enrollment_data?.gender || "",
					"Phone": enrollment_data?.phone || "",
					"Total Benefit": approaching_max_benefit_results_map?.total_benefits !== undefined ? approaching_max_benefit_results_map.total_benefits : "",
					"Current Balance": approaching_max_benefit_results_map?.current_year_available !== undefined ? approaching_max_benefit_results_map.current_year_available : "",
					"Database ID": approaching_max_benefit_results_map.patient_id
				};
			});
			let reached_max_benefit_results;
			reached_max_benefit_results = list_patients.filter(element => element.current_year_available === 0);
			console.log(reached_max_benefit_results.length);
			let reached_max_benefit_response = reached_max_benefit_results.map(function (reached_max_benefit_results_map) {
				const enrollment_data = JSON.parse(reached_max_benefit_results_map?.enrollment_data || "{}");
				return {
					"Previous Member ID": reached_max_benefit_results_map?.prior_member_id || "",
					"Current Member ID": reached_max_benefit_results_map?.member_id || "",
					"Enrollment Date": reached_max_benefit_results_map?.enrollment_date || "",
					"First Name": enrollment_data?.first_name || "",
					"Last Name": enrollment_data?.last_name || "",
					"Date of Birth": enrollment_data?.dob || "",
					"Gender": enrollment_data?.gender || "",
					"Phone": enrollment_data?.phone || "",
					"Total Benefit": reached_max_benefit_results_map?.total_benefits !== undefined ? reached_max_benefit_results_map.total_benefits : "",
					"Current Balance": reached_max_benefit_results_map?.current_year_available !== undefined ? reached_max_benefit_results_map.current_year_available : "",
					"Database ID": reached_max_benefit_results_map.patient_id
				};
			});
			let exceeded_max_benefit_results;
			exceeded_max_benefit_results = list_patients.filter(element => element.current_year_available < 0);
			console.log(exceeded_max_benefit_results.length);
			let exceeded_max_benefit_response = exceeded_max_benefit_results.map(function (exceeded_max_benefit_results_map) {
				const enrollment_data = JSON.parse(exceeded_max_benefit_results_map?.enrollment_data || "{}");
				return {
					"Previous Member ID": exceeded_max_benefit_results_map?.prior_member_id || "",
					"Current Member ID": exceeded_max_benefit_results_map?.member_id || "",
					"Enrollment Date": exceeded_max_benefit_results_map?.enrollment_date || "",
					"First Name": enrollment_data?.first_name || "",
					"Last Name": enrollment_data?.last_name || "",
					"Date of Birth": enrollment_data?.dob || "",
					"Gender": enrollment_data?.gender || "",
					"Phone": enrollment_data?.phone || "",
					"Total Benefit": exceeded_max_benefit_results_map?.total_benefits !== undefined ? exceeded_max_benefit_results_map.total_benefits : "",
					"Current Balance": exceeded_max_benefit_results_map?.current_year_available !== undefined ? exceeded_max_benefit_results_map.current_year_available :  "",
					"Database ID": exceeded_max_benefit_results_map.patient_id
				};
			});
			let response = {
				"approaching_max_benefit_count": approaching_max_benefit_results.length,
				"reached_max_benefit_count": reached_max_benefit_results.length,
				"exceeded_max_benefit_count": exceeded_max_benefit_results.length,
				"approaching_max_benefit_results": approaching_max_benefit_response,
				"reached_max_benefit_results": reached_max_benefit_response,
				"exceeded_max_benefit_results": exceeded_max_benefit_response
			};
			return response;
		} catch (err) {
			console.log(err);
		}
	}
}