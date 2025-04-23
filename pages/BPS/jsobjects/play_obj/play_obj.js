export default {
	myVar1: [],
	myVar2: {},
	myFun1 () {
		let date = '2023-11-14'
		let converted_date = moment(date).format('YYYY-MM-DD , h:mm:ss a');
		console.log(converted_date)
		return converted_date
	},
	async myFun2 () {
		//	use async-await or promises
		//	await storeValue('varName', 'hello world')
		await get_all_bps_member_ids.run()
		const member_ids = await get_all_bps_member_ids.data.map(d => d.member_id)
		console.log(await get_all_bps_member_ids.data.includes("1143457207").toString())
		showAlert(await get_all_bps_member_ids.data.includes("1143457207").toString())
		console.log(member_ids.includes("1143457207"))		
	}
}