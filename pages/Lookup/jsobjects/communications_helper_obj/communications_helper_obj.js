export default {
	myVar1: [],
	myVar2: {},
	get_url: async (s3_bucket, s3_key) => {
		try {
			await hemlibra_communication_query.run({s3_bucket: "xolair-s3", s3_key: ""});
			const url = decodeURIComponent(hemlibra_communication_query.data[0].signedUrl);
			if (!url) throw new Error("File could not be found");
			await navigateTo(url, {}, "NEW_WINDOW");
			return {
				"message": "Opening file"
			};
		} catch (err) {
			console.log(err.toString());
			return {
				message: "File could not be found"
			};
		}
	},
	download_file: async () => {
		try {
			await download_hem_comm_api.run();
			await download(download_hem_comm_api.data, patient_communications_table.triggeredRow["S3 Key"].split("/").at(-1));
			return {
				"message": "Downloaded"
			};
		} catch (err) {
			console.log(err);
			return {
				"message": "Failed to download"
			};
		}
	},
	lookup_communcations_by_date: async (from_date, to_date) => {
		try {
			if (!from_date || !to_date) {
				showAlert("Please enter both From and To Date")
			const communications_date_range_response = await communications_date_range_api.run(); 
			
			return communications_date_range_response.map((communication_obj) => {
				const communication_data = JSON.parse(communication_obj?.communication_data || "{}")
				
				return {
					"Member ID": communication_obj?.member_id || "",
					"Document Type": communication_obj?.document_type || "",
					"Document Name": communication_data?.file_location?.file_name || "",
					"S3 Bucket": communication_data?.file_location?.s3_bucket || "",
					"S3 Key": `${communication_data?.file_location?.s3_folder || ""}${communication_data?.file_location?.file_name || ""}`.replace("/LTR/", "/LETTERS/"),
					"Document Received Date": communication_obj?.document_received_date || "",
					"Document Sent Date": communication_obj?.document_sent_date || "",
					"Document Processed Date": communication_obj?.document_processed_date || ""
				};
			});
			}
			
			const communications_date_range_response = await communications_date_range_api.run({"from_date": from_date, "to_date": to_date}) 
			
			return communications_date_range_response.map((communication_obj) => {
				const communication_data = JSON.parse(communication_obj?.communication_data || "{}")
				
				return {
					"Member ID": communication_obj?.member_id || "",
					"Document Type": communication_obj?.document_type || "",
					"Document Name": communication_data?.file_location?.file_name || "",
					"S3 Bucket": communication_data?.file_location?.s3_bucket || "",
					"S3 Key": `${communication_data?.file_location?.s3_folder || ""}${communication_data?.file_location?.file_name || ""}`.replace("/LTR/", "/LETTERS/"),
					"Document Received Date": communication_obj?.document_received_date || "",
					"Document Sent Date": communication_obj?.document_sent_date || "",
					"Document Processed Date": communication_obj?.document_processed_date || ""
				};
			})
		}
		catch (err) {
			console.log(err.toString())
			return [				
				{	
					"Member ID": "",
					"Document Type": "",
					"Document Name": "",
					"S3 Bucket": "",
					"S3 Key": "",
					"Document Received Date": "",
					"Document Sent Date": "",
					"Document Processed Date": ""
				}
	];
		}
	}	
}