export default {
	get_date_enrollment_change_to_inactive: async (member_id) => {
		await get_date_enrollment_inactive.run({member_id: member_id})	
		// showAlert("found " + get_date_enrollment_inactive.data.length)
		if (get_date_enrollment_inactive.data.length == 0) return
		const res = get_date_enrollment_inactive.data[0]
		let date_made_inactive = res["created"]
		if (date_made_inactive){		
			date_made_inactive = new Date(date_made_inactive)
		}
		// console.log(res["created"]) // use for date
		// console.log(res)
		// console.log(JSON.stringify(res))
		// console.log(res["change_json"])
		// console.log("show patient_id")
		const res_json = JSON.parse(JSON.stringify(res))
		const change_json =  res_json.change_json //res["change_json"]["patient_id"]
		// console.log("show change_json")
		// console.log(change_json)

		// console.log("stringified change json")
		// console.log(JSON.stringify(change_json))
		const jsonified_change_json = JSON.parse(JSON.stringify(change_json))
		// console.log("jsonified_change_json")
		// console.log(jsonified_change_json)
		// console.log("show patient_id")
		// console.log(jsonified_change_json["patient_id"])
		// console.log("show patient")

		var patient 
		JSON.parse(jsonified_change_json, (key, value) => key === 'patient' ? (patient = value) : value)

		// console.log( patient )		
		// console.log("stringify patient")

		const stringified_patient = JSON.stringify(patient)
		// console.log(stringified_patient)
		const jsonified_patient = JSON.parse(stringified_patient)
		// console.log("jsonified_patient")
		// console.log(jsonified_patient)
		// const patient_json = JSON.parse(patient) 
		var enrollment_status
		JSON.parse(stringified_patient, (key, value) => key === 'enrollment_status' ? (enrollment_status = value) : value)		
		// console.log("enrollment_status")
		// console.log(enrollment_status)
		// console.log(jsonified_patient.enrollment_status)

		if (enrollment_status == 'Inactive' || enrollment_status == 'inactive') {
			storeValue("enrollment_end_dt", date_made_inactive)
		} else {
			storeValue("enrollment_end_dt", "")
		}
	},		
	getStandardizedDate : (dateStr) => {
		// All matched results output to YYYY-MM-DD format
		// Unmatched results return as the original dateStr value passed in

		if (!dateStr || dateStr.length === 1 || typeof dateStr !== "string") return dateStr;

		let match = null;

		// 7/7/2023
		// 07/07/2023
		// 10/10/2023
		match = dateStr.match(/^(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])\/([0-9]{4})$/);
		if (match) return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;

		// 7/7/23
		// 07/07/23
		// 10/10/23
		// YY = first 2 digits of current year if last 2 digits of dateStr are <= last 2 digits of current year
		//      Ex1: Current date = 7/7/23, dateStr = "12/31/23", returns "2023-12-31"
		//      Ex2: Current date = 7/7/23, dateStr = "1/1/24", returns "1924-01-01"
		match = dateStr.match(/^(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])\/([0-9]{2})$/);
		if (match) {
			const currYear = new Date().getFullYear();
			const YY = match[3] > currYear % 100 ? Math.ceil(currYear / 100) - 2 : Math.ceil(currYear / 100) - 1;
			return `${YY}${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
		}

		// 7/7/23 Time
		// 07/07/23 Time
		// 10/10/23 Time
		// YY = first 2 digits of current year if last 2 digits of dateStr are <= last 2 digits of current year
		//      Ex1: Current date = 7/7/23, dateStr = "12/31/23", returns "2023-12-31"
		//      Ex2: Current date = 7/7/23, dateStr = "1/1/24", returns "1924-01-01"
		match = dateStr.match(/^(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])\/([0-9]{2})/);
		if (match) {
			const currYear = new Date().getFullYear();
			const YY = match[3] > currYear % 100 ? Math.ceil(currYear / 100) - 2 : Math.ceil(currYear / 100) - 1;
			return `${YY}${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
		}

		// 7-7-2023
		// 07-07-2023
		// 10-10-2023
		match = dateStr.match(/^(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])-([0-9]{4})$/);
		if (match) return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;

		// 7-7-23
		// 07-07-23
		// 10-10-23
		// YY = first 2 digits of current year if last 2 digits of dateStr are <= last 2 digits of current year
		//      Ex1: Current date = 7/7/23, dateStr = "12/31/23", returns "2023-12-31"
		//      Ex2: Current date = 7/7/23, dateStr = "1/1/24", returns "1924-01-01"
		match = dateStr.match(/^(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])-([0-9]{2})$/);
		if (match) {
			const currYear = new Date().getFullYear();
			const YY = match[3] > currYear % 100 ? Math.ceil(currYear / 100) - 2 : Math.ceil(currYear / 100) - 1;
			return `${YY}${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
		}

		// 2023/7/7
		// 2023/07/07
		// 2023/10/10
		match = dateStr.match(/^([0-9]{4})\/(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])$/);
		if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;

		// 23/7/7
		// 23/07/07
		// 23/10/10
		// YY = first 2 digits of current year if last 2 digits of dateStr are <= last 2 digits of current year
		//      Ex1: Current date = 7/7/23, dateStr = "12/31/23", returns "2023-12-31"
		//      Ex2: Current date = 7/7/23, dateStr = "1/1/24", returns "1924-01-01"
		match = dateStr.match(/^([0-9]{2})\/(1[0-2]|0?[1-9])\/(3[01]|[12][0-9]|0?[1-9])$/);
		if (match) {
			const currYear = new Date().getFullYear();
			const YY = match[1] > currYear % 100 ? Math.ceil(currYear / 100) - 2 : Math.ceil(currYear / 100) - 1;
			return `${YY}${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
		}

		// 2023-7-7
		// 2023-07-07
		// 2023-10-10
		match = dateStr.match(/^([0-9]{4})-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])/);
		if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;

		// 23-7-7
		// 23-07-07
		// 23-10-10
		// YY = first 2 digits of current year if last 2 digits of dateStr are <= last 2 digits of current year
		//      Ex1: Current date = 7/7/23, dateStr = "12/31/23", returns "2023-12-31"
		//      Ex2: Current date = 7/7/23, dateStr = "1/1/24", returns "1924-01-01"
		match = dateStr.match(/^([0-9]{2})-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])$/);
		if (match) {
			const currYear = new Date().getFullYear();
			const YY = match[1] > currYear % 100 ? Math.ceil(currYear / 100) - 2 : Math.ceil(currYear / 100) - 1;
			return `${YY}${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
		}

		// 20230707
		// 20231010
		match = dateStr.match(/^([0-9]{4})(1[0-2]|0[1-9])(3[01]|[12][0-9]|0[1-9])$/);
		if (match) return `${match[1]}-${match[2]}-${match[3]}`;

		return dateStr;
	},
	getStandardizedPrettyDate: (dateStr) => {
		dateStr = utils.getStandardizedDate(dateStr)

		const match = dateStr.match(/^([0-9]{4})-(1[0-2]|0?[1-9])-(3[01]|[12][0-9]|0?[1-9])/);
		if (match) return `${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}-${match[1]}`;

		return dateStr
	}
}