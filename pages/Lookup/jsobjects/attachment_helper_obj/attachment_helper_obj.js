export default {
	constants: {
		s3_path: "hemlibra",
		s3_bucket: "notes-attachment-files",
	},
	add: async (user_name, patient_id, attachment_type, file_name, file, created) => {
		
		if (!attachment_type) {
			showAlert("Attachment Type Cannot Be Blank")
			return;
		}

		if (!patient_id) {
			showAlert("Please Make Sure Patient is Selected")
			return;
		}
		// save file to s3		
		const s3_key = await this.upload(this.constants.s3_bucket, this.constants.s3_path + "/" + patient_id + "/" +file_name, file); 
		// save record to db
		add_patient_attachment.run({user_name: user_name, patient_id: patient_id,  file_description: attachment_type, 
																s3_bucket: this.constants.s3_bucket, s3_key: s3_key})
		get_patient_attachments.run({patient_id: patient_id});
		showAlert("Attachment Save Successful");
	},
	upload: async (bucket, s3_path, file) => {
		const res = await upload_patient_attachment_s3.run({s3_bucket: bucket, s3_path: s3_path, file: file});
		const s3_key = res.signedUrl.split('?')[0];
		// showAlert(s3_key.split(".com/")[1]);
		return s3_key.split(".com/")[1];
	},	
	delete_attachment: (patient_id, attachment_id, path) =>{
		return delete_patient_attachment_s3.run({bucket: this.constants.s3_bucket, path: path.split(".com/")[1]})
		.then(() => delete_patient_attachment_db.run({attachment_id: attachment_id}))
		.then(() => get_patient_attachments.run({patient_id: patient_id}));
	},
		// new Date().toISOString().replace(/T/, ' ').replace(/Z/, '') 

	download_file: async (s3_bucket, s3_key) => {
		try {
			const res = await get_patient_attachment_s3.run({s3_bucket: s3_bucket, s3_key: s3_key});
			const url = decodeURIComponent(res.signedUrl);
			showAlert(res.signedUrl);
			showAlert(url);
			if (!url) throw new Error("File could not be found");
			await navigateTo(url, {}, "NEW_WINDOW");
			return {
				"message": "Opening file"
			};
		} catch (err) {
			showAlert(err.message);
			console.log(err.toString());
			return {
				message: "File could not be found"
			};
		}
	},
	get_file: async (s3_bucket, s3_key) => {
		try {
			showAlert(s3_bucket + s3_key);
			const res = await get_patient_attachment_s3.run({s3_bucket: s3_bucket, s3_key: s3_key});
			const url = decodeURIComponent(res.signedUrl);
			showAlert(res.signedUrl);
			showAlert(url);
			if (!url) return; //throw new Error("File could not be found");
			// put url in memory for access in app 
			storeValue({patient_attachment_url: url});
		} catch (err) {
			showAlert("error in get_file" + err.message);
			console.log(err.toString());
			return {
				message: "File could not be found"
			};
		}
	},
	
}