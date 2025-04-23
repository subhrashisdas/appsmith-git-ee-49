export default {
	myVar1: [],
	myVar2: {},
	myFun1: () => {
		//write code here
	},
	update_active_tab: async (tab_name, id) => {
		 
		 const patient_id = id.toString();
		// put this code in on row select for patient lookup table: patient_helper_obj.update_active_tab(detail_tab.selectedTab);
		if ( "Patient Detail" == tab_name.trim() ) { 
			// don't need to do anything, data being pulled from storeValue() patient_obj
			
			// showAlert(tab_name + " clicked " + " == Patient Detail")
			// use id but need to check that DC's code is ok to use database id of patient
			// await patient_details_obj.get_patient_profile(id);
			// await patient_details_obj.get_patient_caregiver_info(id);
		 	// await patient_details_obj.get_patient_enrollment_details(id);
			await get_patient_attestation.run({patient_id: patient_id});
		} else if (tab_name == "Communications") {
			// showAlert(tab_name + " clicked " + " == Communications" + " id " + patient_id);
			await patient_helper_obj.get_patient_communication_details(patient_id);
		} else if ( "Claims" == tab_name.trim() ) {
			await patient_helper_obj.get_patient_claims_details(patient_id);
		} else if ( "Notes" == tab_name.trim() ) {
			// showAlert(tab_name + " clicked " + " == Notes");
			await get_patient_notes.run({patient_id: patient_id});
		} else if ( "Insurance" == tab_name.trim() ) {
			// showAlert(tab_name + " clicked " + " == Insurance");
			await patient_helper_obj.display_insurance_info(patient_id);
		} else if ( "Omni Check" == tab_name.trim() ) {
			// showAlert(tab_name + " clicked " + " == Omni Check" + " id " + patient_id);
			const omni_check_history = await patient_helper_obj.get_patient_omni_check_history(id);
			// showAlert(omni_check_history);
			storeValue("omni_check_obj", omni_check_history);
			
		} else if ( "Assoc. Patients" == tab_name.trim() ) {
			const provider_associated_patients = await provider_helper_obj_bu.get_patients_of_provider(provider_lookup_table.selectedRow["Provider ID"]);
		} else if ( "Assoc. Providers" == tab_name.trim() ) {
			
		}
		
		// } else if (tab_name == "Attachments") {
			// await get_patient_attachments.run({patient_id: patient_lookup_table.selectedRow["Database ID"]}) }

		




	},

	// update_tab_data: async (child_active_tab_name, parent_active_tab) => {
		// if ("" == parent_active_tab.toUpperCase()) {
			// 
		// } else if ("" == parent_active_tab.toUpperCase()) {
			// 
		// }
	// }
}