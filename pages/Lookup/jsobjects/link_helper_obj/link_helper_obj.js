export default {
	myVar1: [],
	myVar2: {},
	myFun1 () {
		//	write code here
		//	this.myVar1 = [1,2,3]
	},
	async delink_patient_to_provider (npi, member_id, link_type) {
		if(!npi || !member_id || !link_type) {
			showAlert("Either NPI, Member ID, or Link Type is Missing.  Please try again.")
			return
		}
		await delink_patient_provider_api.run({npi:npi, member_id: member_id, patient_provider_type: link_type})
		showAlert(JSON.stringify(delink_patient_provider_api.data))
		provider_helper_obj.get_patients_of_provider(appsmith.store.provider_id)

		//	use async-await or promises
		//	await storeValue('varName', 'hello world')
	}
}