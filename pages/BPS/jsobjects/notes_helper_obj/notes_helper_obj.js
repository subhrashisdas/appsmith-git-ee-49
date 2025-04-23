export default {

	add_bps_note: async (user_name, patient_id, disposition, notes, created, hide_message) => {
		if (!disposition) {
			showAlert("Disposition Cannot Be Blank")
			return;
		}

		if (!patient_id) {
			showAlert("Please Make Sure Patient is Selected")
			return;
		}

		try {
			await add_bps_note.run(
				{ user_name: user_name,
				 patient_id: patient_id,
				 disposition: disposition,
				 notes: notes,
				 created: created
				});
			// get_bps_notes.run({patient_id: patient_id});
			bps_helper_obj.get_and_store_bps_notes(patient_id, 'bps')
			if (!hide_message) showAlert("Notes Successfully Added")
			await get_bps_notes.run({patient_id: patient_id})
		} catch(e) {
			showAlert(e);			
		}
	},

	update_bps_note: async (notes_id, user_name, patient_id, disposition, notes, created) => {
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
		notes_id = parseInt(notes_id.toString())
		showAlert(notes_id.toString())
		storeValue("disposition", disposition)
		storeValue("notes", notes)
		storeValue("created", created)
		storeValue("patient_id", patient_id)
		storeValue("user_name", appsmith.user.username)
		storeValue("notes_id", notes_id)

		try {
			await update_bps_note.run(
				{ notes_id: notes_id,
				 user_name: appsmith.user.username,
				 patient_id: patient_id,
				 disposition: disposition,
				 notes: notes,
				 created: created
				});


			get_bps_notes.run({patient_id: patient_id});
			// bps_helper_obj.get_and_store_bps_notes(patient_id, 'bps')
			showAlert("Notes Successfully Updated");
			showAlert(update_bps_note.data)
			console.log(update_bps_note.data)

		} catch(e) {
			showAlert("Update Failed " + e.message);			
		}
	},	


	// fill_form_bps: async (disposition, notes) => {
	// bps_disposition_sel.setSelectedOption(disposition);
	// bps_notes_input.setValue(notes);  // <= this doesn't really work - field in form pulls from table directly
	// 
	// },	
	fill_form_bps: async (disposition, notes) => {

		if (bps_disposition_sel.selectedOptionLabel != disposition) {
			bps_notes_input.setValue(disposition + " - " + notes);  
			bps_disposition_sel.setSelectedOption("");
		} else {
			bps_notes_input.setValue(notes);  		
			bps_disposition_sel.setSelectedOption(disposition);

		}



	},	
	sqlToJsDate: () => {
		const sqlDate = 1693261167223;

		const newDate = Date(1409763303817)// new Date(sYear,sMonth,sDay,sHour,sMinute,sSecond,sMillisecond);
		showAlert(newDate);
		return newDate;
	}


}
