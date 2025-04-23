export default {
	myVar1: [],
	myVar2: {},
	parse_claim_data_and_put_in_store: (claims_obj) => {
		// const patient_claims = patient_claim_patient_id_api.data
		claims_obj = patient_claims_table.selectedRow.claim_data
		if (!claims_obj) {
			showAlert("No claims found.")	
			return
		}

		let patient_claim = JSON.parse(claims_obj || {})
		storeValue("patient_claim", patient_claim)	
		try {
			const claim_providers = patient_claim?.providers || {}
			storeValue("claim_providers", claim_providers)
		} catch (e) {
			// showAlert(JSON.stringify(e))
			console.log(e)
		}
		
		try {
			const claim_shipping_info = JSON.parse(patient_claim?.shipping_info || {}) 
			const claim_patient_data = JSON.parse(patient_claim?.patient_data || {}) 
			const claim_provider_data = JSON.parse(patient_claim?.provider_data || {}) 
			const claim_providers = patient_claim?.providers || {}
			const claim_paysign_api_data = patient_claim?.paysign_api_data || {}
			if (claim_shipping_info) {
				delete patient_claim.shipping_info
				storeValue("claim_shipping_info", claim_shipping_info)		
			}
			if (claim_patient_data) {
				delete patient_claim.patient_data
				storeValue("claim_patient_data", claim_patient_data)
			}
			if (claim_provider_data) {
				delete patient_claim.provider_data
				storeValue("claim_provider_data", claim_provider_data)
			}
			if (claim_providers) {
				delete patient_claim.providers
				storeValue("claim_providers", claim_providers)
			}
			if (claim_paysign_api_data) {
				delete patient_claim.paysign_api_data
				storeValue("claim_paysign_api_data", claim_paysign_api_data)
			}
			// console.log(patient_claim)
			storeValue("patient_claim", patient_claim)
		} catch(e) {
			// console.log(patient_claim)
					
			console.log(patient_claim)
		}
		
		
		// return patient_claim
		return patient_claim
		// return patient_data
		// return provider_data
		// delete patient_claim["provider_data"]
		// delete patient_claim["patient_data"]
		
	},
	
}