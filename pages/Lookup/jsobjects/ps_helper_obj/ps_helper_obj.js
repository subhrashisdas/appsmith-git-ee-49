export default {
	// update_accumulator_balance: async (member_ids_to_accum_balance_list) => {
		// 'use strict';
		// member_ids_to_accum_balance_list = [
			// '1147308844 22048.41',
			// '1142839090 20755.0',
			// '1140054692 14338.8']
// 
		// let successful_updates = []
		// let successful_updates_count = 0
		// let failed_updates = []
		// let failed_updates_count = 0
		// let member_ids_not_found = []
		// let member_ids_not_found_count = 0
// 
		// let already_at_max_benefit = []
		// let already_at_max_benefit_count = 0
		// const max_benefit = 15000.00
		// const max_benefit_no_dec = max_benefit // 1500000
// 
		// let all_current_balances_no_updates = []
// 
		// let accum_amt_client_program 	
		// let accum_amt_rx_program 
		// let program_url
// 
// 
		// const username = connections_helper_obj.ps_prod_user;
		// const password = connections_helper_obj.ps_prod_pw;
// 
		// const basicAuth = 'Basic ' + btoa(username + ':' + password);
// 
		// const headers = {
			// "Authorization": basicAuth,
			// "Content-Type": "application/x-www-form-urlencoded",
			// "KEY-TOKEN": "HTI6*>R9ZBFU!01G4<^F94KT!$BL2R0$8N66S42~SC*LVKLPP1IIHOJ<%HAH" }
// 
		// for (let i=0; i < member_ids_to_accum_balance_list.length; i++) {
			// 
			// }
// 
			// await get_patient_id_from_member_id.run({member_id: member_id})
			// let patient_id = await get_patient_id_from_member_id.data 
			// if (patient_id.length == 0) {
				// member_ids_not_found.push(member_id + " could not be found.")
				// member_ids_not_found_count += 1
				// showAlert((member_id + " could not be found."))
				// continue				
			// }
// 
		// const url = connections_helper_obj.ps_prod_domain + 
					// "/copay/api/v1/tpc/get_accumulator_balance?program=" + connections_helper_obj.ps_prod_program + 
					// "&sponsor=" + connections_helper_obj.ps_prod_sponsor + "&member_number=" + member_id 	
// 
		// program_url = url + "&a_balance_type=CLIENTPROGRAM"	
// 
		// try {
			// await fetch(program_url, {
				// method: 'GET', // or 'POST', 'PUT', etc.
				// headers: headers,
			// })
				// .then(function (resp) {
				// console.log(resp.status == 400)
				// if (resp.status == 400) {
					// accum_amt_client_program = 0.00 
					// return {"balance": accum_amt_client_program}
				// }
				// // Return the response as JSON
				// return resp.json();
			// })
				// .then(function (data) {
				// accum_amt_client_program = (data?.balance);
			// })
				// .catch(error => {
				// // Handle errors
				// console.error('Fetch accum_amt_client_program payments error:', error);
			// });} catch (e) {
				// console.log(e)
			// }
// 
		// console.log("accum_amt_client_program payments " + accum_amt_client_program + " " + member_id)
// 
		// program_url = url + "&a_balance_type=RXPROGRAM"	
		// try {
			// await fetch(program_url, {
				// method: 'GET', // or 'POST', 'PUT', etc.
				// headers: headers,
			// })
				// .then(function (resp) {
				// // Return the response as JSON
				// if (resp.status == 400) {
					// accum_amt_rx_program = 0.00 
					// return {"balance": accum_amt_rx_program}
				// }
				// return resp.json();
			// })
				// .then(function (data) {
				// accum_amt_rx_program = (data?.balance);
			// })
				// .catch(error => {
				// // Handle errors
				// console.error('Fetch accum_amt_rx_program error:', error);
			// });} catch (e) {
				// console.log(e)
			// }
// 
		// console.log("accum_amt_rx_program payments " + accum_amt_rx_program  + " " + member_id)
// 
		// let available_balance_before_update 
		// program_url = url + "&a_balance_type=AVAILABLEBALANCE"	
// 
		// let isNegativeBalance = false
		// try {
			// await fetch(program_url, {
				// method: 'GET', // or 'POST', 'PUT', etc.
				// headers: headers,
			// })
				// .then(function (resp) {
				// // Return the response as JSON
// 
				// if (resp.status == 400) {
					// console.log("status 400 message for available balance" + resp.json().message)
					// isNegativeBalance = true // only get 400 response here when see negative balance
					// available_balance_before_update = max_benefit_no_dec
					// return {"balance": available_balance_before_update}
				// }
// 
				// return resp.json();
			// })
				// .then(function (data) {
				// available_balance_before_update = data?.balance;
			// })
				// .catch(error => {
				// // Handle errors
				// console.error('Fetch available balance before update error:', error);
			// });}  catch (e) {
				// console.log(e)
			// }
		// all_current_balances_no_updates.push(member_id + " : accumulator amount Client Program: " + accum_amt_client_program + " RX Program: " + accum_amt_rx_program + " Balance Available " + available_balance_before_update)
// 
		// continue // stop here to get balance  
// 
		// if (isNegativeBalance) {
			// already_at_max_benefit.push(member_id + " Error getting available balance which is associated with negative balances. accumulator clientt program: " + accum_amt_client_program + " accumulator rx program: " + accum_amt_rx_program) 
			// already_at_max_benefit_count += 1
			// showAlert(member_id + " Error getting available balance which is associated with negative balances. accumulator clientt program: " + accum_amt_client_program.toString() + " accumulator rx program: " + accum_amt_rx_program.toString())
			// continue				
		// }
// 
		// console.log("available balance before update" + available_balance_before_update  + " " + member_id)
// 
		// accum_amt_client_program = (parseFloat(accum_amt_client_program)/100).toFixed(2)
		// accum_amt_rx_program = (parseFloat(accum_amt_rx_program)/100).toFixed(2)
		// available_balance_before_update = (parseFloat(available_balance_before_update)/100).toFixed(2)
// 
		// if (accum_amt_client_program >= max_benefit) {
			// already_at_max_benefit.push(member_id + " No balance update as patient at max accumulator balance " + accum_amt_client_program)
			// already_at_max_benefit_count += 1
			// showAlert(member_id + " No update required as patient is already at max accumulator " + accum_amt_client_program.toString())
			// continue
		// }
// 
		// if (available_balance_before_update == 0) {
			// already_at_max_benefit.push(member_id + " No balance update as patient available balance is at " + available_balance_before_update.toString())
			// already_at_max_benefit_count += 1
			// showAlert(member_id + " No balance update as patient available balance is at " + available_balance_before_update.toString())
			// continue
		// }
// 
		// if (isNaN(accum_amt_client_program) || isNaN(accum_amt_rx_program) || isNaN(available_balance_before_update)) {
			// failed_updates.push(member_id + " failed to update because an accumulator value was not a number. Client Program: " + accum_amt_client_program + " RX Program: " + accum_amt_rx_program + " Balance Available " + available_balance_before_update)
			// failed_updates_count += 1
			// showAlert(member_id + " failed to update because an accumulator value was not a number. Client Program: " + accum_amt_client_program.toString() + " RX Program: " + accum_amt_rx_program.toString() + " Balance Available " + available_balance_before_update.toString())
			// continue
		// }
// 
		// showAlert("accum client program " + accum_amt_client_program.toString() + "\n accum rx program " + accum_amt_rx_program.toString() + "\n available balance before update " + available_balance_before_update)
// 
// 
		// accum_amt_submitted_for_update = parseFloat(accum_amt_submitted_for_update)
		// // remove decimals and add 00
		// if (accum_amt_submitted_for_update % 1 != 0) {
			// if (accum_amt_submitted_for_update % 0.1 == 0) {
				// accum_amt_submitted_for_update = accum_amt_submitted_for_update * 1000
			// } else if ((accum_amt_submitted_for_update % 0.01 == 0)) {
				// accum_amt_submitted_for_update = accum_amt_submitted_for_update * 10000
			// } else {
// 
				// failed_updates.push(member_id + "Something went wrong with converting accum_amt_submitted_for_update " + accum_amt_submitted_for_update.toString())
				// failed_updates_count += 1
				// showAlert((member_id + " Something went wrong with converting accum_amt_submitted_for_update " + accum_amt_submitted_for_update.toString()))
				// continue				
			// }
		// } else {
			// accum_amt_submitted_for_update = accum_amt_submitted_for_update * 100
		// }		
// 
		// console.log("accumulator amount to be submitted for balance update: " + accum_amt_submitted_for_update  + " " + member_id)
		// showAlert("accumulator amount to be submitted for balance update: " + accum_amt_submitted_for_update)
// 
		// //continue // stop here for testing
// 
		// try { 
			// await update_accumulator_ps.run({ member_id: member_id, balance: accum_amt_submitted_for_update })
			// // successful_updates.push(member_id + " updated successfully. Client Program Accum before: " + accum_amt_client_program + " RX Program Accum before: " + accum_amt_rx_program + " Balance Available Accum before: " + available_balance_before_update + " New Accum Balance submitted for update " + accum_amt_submitted_for_update + " Balance Available Accum after update: " + available_balance_after_update)
			// successful_updates.push(member_id + " updated successfully. Client Program Accum before: " + accum_amt_client_program + " RX Program Accum before: " + accum_amt_rx_program + " Balance Available Accum before: " + available_balance_before_update + " New Accum Balance submitted for update " + accum_amt_submitted_for_update)
			// successful_updates_count += 1				
// 
			// // showAlert("Balance update successful")
		// } catch(e) {
			// failed_updates.push(member_id + " Error updating balance due to paysign api. " + JSON.stringify(e))
			// failed_updates_count += 1
			// showAlert("Error updating balance due to paysign api. " + JSON.stringify(e))
			// continue			
		// }
// 
// 
		// let available_balance_after_update
		// program_url = url + "&a_balance_type=AVAILABLEBALANCE"	
// 
		// try {
			// await fetch(program_url, {
				// method: 'GET', // or 'POST', 'PUT', etc.
				// headers: headers,
			// })
				// .then(function (resp) {
				// // Return the response as JSON
				// if (resp.status == 400) {
					// available_balance_after_update = max_benefit_no_dec
					// return {"balance": available_balance_after_update}
				// }
// 
				// return resp.json();
			// })
				// .then(function (data) {
				// available_balance_after_update = data?.balance;
			// })
				// .catch(error => {
				// // Handle errors
				// console.error('Fetch available balance after update error:', error);
			// });
		// } catch (e) {
			// console.log(e)
		// }
		// console.log("available balance after update" + available_balance_after_update  + " " + member_id)
// 
		// let date_of_service = new Date()
		// await	add_accum_update_record_ps.run({patient_id: patient_id, accum_amt_client_program: accum_amt_client_program, accum_amt_rx_program: accum_amt_rx_program, available_balance_before_update: available_balance_before_update, available_balance_after_update: available_balance_after_update, member_id: member_id, accum_amt_submitted_for_update: accum_amt_submitted_for_update, date_of_service: date_of_service})	
// 
		// 
	// }
// 
	// // 
	// // const update_balance_results = {
	// // "successes": successful_updates || [],
	// // "fails": failed_updates || [],
	// // "already_at_max_benefit": already_at_max_benefit || [],
	// // "member_ids_not_found": member_ids_not_found || []
	// // }
	// // 
	// // console.log("all current balances " + all_current_balances_no_updates)
	// // return
	// // console.log(update_balance_results)
	// // await log.run({action_type: constants.update_patient_balance_en_mass, ref_id: "MULTIPLE RIS ID", ref_id_type: constants.member_id, change_json: JSON.stringify(update_balance_results) });		
	// // update_balance_results["successes"] = update_balance_results["successes"].join(",  ")
	// // update_balance_results["fails"] = update_balance_results["fails"].join(",  ")
	// // update_balance_results["already_at_max_benefit"] = update_balance_results["already_at_max_benefit"].join(",  ")
	// // update_balance_results["member_ids_not_found"] = update_balance_results["member_ids_not_found"].join(",  ")
	// // storeValue("update_balance_results", update_balance_results)
	// // storeValue("successful_update_count", successful_updates_count)
	// // storeValue("failed_update_count", failed_updates_count)
	// // storeValue("already_at_max_benefit_count", already_at_max_benefit_count)			
	// // storeValue("member_ids_not_found_count", member_ids_not_found_count)
// 
	// // return update_balance_results		
// },	


	top_off_accumulator_balance: async (member_ids_to_accum_balance_dict) => {
		'use strict';
		let successful_updates = []
		let successful_updates_count = 0
		let failed_updates = []
		let failed_updates_count = 0
		let member_ids_not_found = []
		let member_ids_not_found_count = 0

		let already_at_max_benefit = []
		let already_at_max_benefit_count = 0
		const max_benefit = 15000.00
		const max_benefit_no_dec = max_benefit // 1500000
		let all_current_balances_no_updates = []


		let accum_amt_client_program 	
		let accum_amt_rx_program 
		let program_url




		const username = connections_helper_obj.ps_prod_user;
		const password = connections_helper_obj.ps_prod_pw;

		const basicAuth = 'Basic ' + btoa(username + ':' + password);

		const headers = {
			"Authorization": basicAuth,
			"Content-Type": "application/x-www-form-urlencoded",
			"KEY-TOKEN": "HTI6*>R9ZBFU!01G4<^F94KT!$BL2R0$8N66S42~SC*LVKLPP1IIHOJ<%HAH" }

		for (let [member_id, accum_amt_submitted_for_update] of Object.entries(member_ids_to_accum_balance_dict)) {
			console.log(member_id, accum_amt_submitted_for_update);
			// continue

			await get_patient_id_from_member_id.run({member_id: member_id})
			let patient_id = await get_patient_id_from_member_id.data 
			if (patient_id.length == 0) {
				member_ids_not_found.push(member_id + " could not be found.")
				member_ids_not_found_count += 1
				showAlert((member_id + " could not be found."))
				continue				
			}

			const url = connections_helper_obj.ps_prod_domain + 
						"/copay/api/v1/tpc/get_accumulator_balance?program=" + connections_helper_obj.ps_prod_program + 
						"&sponsor=" + connections_helper_obj.ps_prod_sponsor + "&member_number=" + member_id 	

			program_url = url + "&a_balance_type=CLIENTPROGRAM"	

			try {
				await fetch(program_url, {
					method: 'GET', // or 'POST', 'PUT', etc.
					headers: headers,
				})
					.then(function (resp) {
					console.log(resp.status == 400)
					if (resp.status == 400) {
						accum_amt_client_program = 0.00 
						return {"balance": accum_amt_client_program}
					}
					// Return the response as JSON
					return resp.json();
				})
					.then(function (data) {
					accum_amt_client_program = (data?.balance);
				})
					.catch(error => {
					// Handle errors
					console.error('Fetch accum_amt_client_program payments error:', error);
				});} catch (e) {
					console.log(e)
				}

			console.log("accum_amt_client_program payments " + accum_amt_client_program + " " + member_id)

			program_url = url + "&a_balance_type=RXPROGRAM"	
			try {
				await fetch(program_url, {
					method: 'GET', // or 'POST', 'PUT', etc.
					headers: headers,
				})
					.then(function (resp) {
					// Return the response as JSON
					if (resp.status == 400) {
						accum_amt_rx_program = 0.00 
						return {"balance": accum_amt_rx_program}
					}
					return resp.json();
				})
					.then(function (data) {
					accum_amt_rx_program = (data?.balance);
				})
					.catch(error => {
					// Handle errors
					console.error('Fetch accum_amt_rx_program error:', error);
				});} catch (e) {
					console.log(e)
				}

			console.log("accum_amt_rx_program payments " + accum_amt_rx_program  + " " + member_id)

			let available_balance_before_update 
			program_url = url + "&a_balance_type=AVAILABLEBALANCE"	

			let isNegativeBalance = false
			try {
				await fetch(program_url, {
					method: 'GET', // or 'POST', 'PUT', etc.
					headers: headers,
				})
					.then(function (resp) {
					// Return the response as JSON

					if (resp.status == 400) {
						console.log("status 400 message for available balance" + resp.json().message)
						isNegativeBalance = true // only get 400 response here when see negative balance
						available_balance_before_update = max_benefit_no_dec
						return {"balance": available_balance_before_update}
					}

					return resp.json();
				})
					.then(function (data) {
					available_balance_before_update = data?.balance;
				})
					.catch(error => {
					// Handle errors
					console.error('Fetch available balance before update error:', error);
				});}  catch (e) {
					console.log(e)
				}
			all_current_balances_no_updates.push(member_id + " : accumulator amount Client Program: " + accum_amt_client_program + " RX Program: " + accum_amt_rx_program + " Balance Available " + available_balance_before_update)

			continue // stop here to get balance  

			if (isNegativeBalance) {
				already_at_max_benefit.push(member_id + " Error getting available balance which is associated with negative balances. accumulator clientt program: " + accum_amt_client_program + " accumulator rx program: " + accum_amt_rx_program) 
				already_at_max_benefit_count += 1
				showAlert(member_id + " Error getting available balance which is associated with negative balances. accumulator clientt program: " + accum_amt_client_program.toString() + " accumulator rx program: " + accum_amt_rx_program.toString())
				continue				
			}

			console.log("available balance before update" + available_balance_before_update  + " " + member_id)

			accum_amt_client_program = (parseFloat(accum_amt_client_program)/100).toFixed(2)
			accum_amt_rx_program = (parseFloat(accum_amt_rx_program)/100).toFixed(2)
			available_balance_before_update = (parseFloat(available_balance_before_update)/100).toFixed(2)

			if (accum_amt_client_program >= max_benefit) {
				already_at_max_benefit.push(member_id + " No balance update as patient at max accumulator balance " + accum_amt_client_program)
				already_at_max_benefit_count += 1
				showAlert(member_id + " No update required as patient is already at max accumulator " + accum_amt_client_program.toString())
				continue
			}

			if (available_balance_before_update == 0) {
				already_at_max_benefit.push(member_id + " No balance update as patient available balance is at " + available_balance_before_update.toString())
				already_at_max_benefit_count += 1
				showAlert(member_id + " No balance update as patient available balance is at " + available_balance_before_update.toString())
				continue
			}

			if (isNaN(accum_amt_client_program) || isNaN(accum_amt_rx_program) || isNaN(available_balance_before_update)) {
				failed_updates.push(member_id + " failed to update because an accumulator value was not a number. Client Program: " + accum_amt_client_program + " RX Program: " + accum_amt_rx_program + " Balance Available " + available_balance_before_update)
				failed_updates_count += 1
				showAlert(member_id + " failed to update because an accumulator value was not a number. Client Program: " + accum_amt_client_program.toString() + " RX Program: " + accum_amt_rx_program.toString() + " Balance Available " + available_balance_before_update.toString())
				continue
			}

			showAlert("accum client program " + accum_amt_client_program.toString() + "\n accum rx program " + accum_amt_rx_program.toString() + "\n available balance before update " + available_balance_before_update)


			accum_amt_submitted_for_update = parseFloat(accum_amt_submitted_for_update)
			// remove decimals and add 00
			if (accum_amt_submitted_for_update % 1 != 0) {
				if (accum_amt_submitted_for_update % 0.1 == 0) {
					accum_amt_submitted_for_update = accum_amt_submitted_for_update * 1000
				} else if ((accum_amt_submitted_for_update % 0.01 == 0)) {
					accum_amt_submitted_for_update = accum_amt_submitted_for_update * 10000
				} else {

					failed_updates.push(member_id + "Something went wrong with converting accum_amt_submitted_for_update " + accum_amt_submitted_for_update.toString())
					failed_updates_count += 1
					showAlert((member_id + " Something went wrong with converting accum_amt_submitted_for_update " + accum_amt_submitted_for_update.toString()))
					continue				
				}
			} else {
				accum_amt_submitted_for_update = accum_amt_submitted_for_update * 100
			}		

			console.log("accumulator amount to be submitted for balance update: " + accum_amt_submitted_for_update  + " " + member_id)
			showAlert("accumulator amount to be submitted for balance update: " + accum_amt_submitted_for_update)

			//continue // stop here for testing

			try { 
				await update_accumulator_ps.run({ member_id: member_id, balance: accum_amt_submitted_for_update })
				// successful_updates.push(member_id + " updated successfully. Client Program Accum before: " + accum_amt_client_program + " RX Program Accum before: " + accum_amt_rx_program + " Balance Available Accum before: " + available_balance_before_update + " New Accum Balance submitted for update " + accum_amt_submitted_for_update + " Balance Available Accum after update: " + available_balance_after_update)
				successful_updates.push(member_id + " updated successfully. Client Program Accum before: " + accum_amt_client_program + " RX Program Accum before: " + accum_amt_rx_program + " Balance Available Accum before: " + available_balance_before_update + " New Accum Balance submitted for update " + accum_amt_submitted_for_update)
				successful_updates_count += 1				

				// showAlert("Balance update successful")
			} catch(e) {
				failed_updates.push(member_id + " Error updating balance due to paysign api. " + JSON.stringify(e))
				failed_updates_count += 1
				showAlert("Error updating balance due to paysign api. " + JSON.stringify(e))
				continue			
			}


			let available_balance_after_update
			program_url = url + "&a_balance_type=AVAILABLEBALANCE"	

			try {
				await fetch(program_url, {
					method: 'GET', // or 'POST', 'PUT', etc.
					headers: headers,
				})
					.then(function (resp) {
					// Return the response as JSON
					if (resp.status == 400) {
						available_balance_after_update = max_benefit_no_dec
						return {"balance": available_balance_after_update}
					}

					return resp.json();
				})
					.then(function (data) {
					available_balance_after_update = data?.balance;
				})
					.catch(error => {
					// Handle errors
					console.error('Fetch available balance after update error:', error);
				});
			} catch (e) {
				console.log(e)
			}
			console.log("available balance after update" + available_balance_after_update  + " " + member_id)

			let date_of_service = new Date()
			await	add_accum_update_record_ps.run({patient_id: patient_id, accum_amt_client_program: accum_amt_client_program, accum_amt_rx_program: accum_amt_rx_program, available_balance_before_update: available_balance_before_update, available_balance_after_update: available_balance_after_update, member_id: member_id, accum_amt_submitted_for_update: accum_amt_submitted_for_update, date_of_service: date_of_service})	



			// storeValue("accum_amt_client_program", accum_amt_client_program)  	
			// storeValue("accum_amt_rx_program", accum_amt_rx_program)  
			// storeValue("available_balance_before_update", available_balance_before_update) 
			// 
			// storeValue("accum_amt_client_program", "-")  	
			// storeValue("accum_amt_rx_program", "-")  
			// storeValue("available_balance_before_update", "-") 
		}
		const update_balance_results = {
			"successes": successful_updates || [],
			"fails": failed_updates || [],
			"already_at_max_benefit": already_at_max_benefit || [],
			"member_ids_not_found": member_ids_not_found || []
		}

		console.log("all current balances " + all_current_balances_no_updates)
		return
		console.log(update_balance_results)
		await log.run({action_type: constants.update_patient_balance_en_mass, ref_id: "MULTIPLE RIS ID", ref_id_type: constants.member_id, change_json: JSON.stringify(update_balance_results) });		
		update_balance_results["successes"] = update_balance_results["successes"].join(",  ")
		update_balance_results["fails"] = update_balance_results["fails"].join(",  ")
		update_balance_results["already_at_max_benefit"] = update_balance_results["already_at_max_benefit"].join(",  ")
		update_balance_results["member_ids_not_found"] = update_balance_results["member_ids_not_found"].join(",  ")
		storeValue("update_balance_results", update_balance_results)
		storeValue("successful_update_count", successful_updates_count)
		storeValue("failed_update_count", failed_updates_count)
		storeValue("already_at_max_benefit_count", already_at_max_benefit_count)			
		storeValue("member_ids_not_found_count", member_ids_not_found_count)

		return update_balance_results		
	},	

		get_patient_balances_and_store_in_memory: async (member_id) => {
			member_id = '1143191681'

			let other_payments 	
			let rx_and_other_payments 
			// let available_balance
			let program_url

			const max_benefit_no_dec = 1500000
			const max_benefit = 15000.00

			const username = connections_helper_obj.ps_prod_user;
			const password = connections_helper_obj.ps_prod_pw;

			const basicAuth = 'Basic ' + btoa(username + ':' + password);

			const headers = {
				"Authorization": basicAuth,
				"Content-Type": "application/x-www-form-urlencoded",
				"KEY-TOKEN": "HTI6*>R9ZBFU!01G4<^F94KT!$BL2R0$8N66S42~SC*LVKLPP1IIHOJ<%HAH" }
			const url = connections_helper_obj.ps_prod_domain + 
						"/copay/api/v1/tpc/get_accumulator_balance?program=" + connections_helper_obj.ps_prod_program + 
						"&sponsor=" + connections_helper_obj.ps_prod_sponsor + "&member_number=" + member_id 	

			program_url = url + "&a_balance_type=CLIENTPROGRAM"	

			try {
				await fetch(program_url, {
					method: 'GET', // or 'POST', 'PUT', etc.
					headers: headers,
				})
					.then(function (resp) {
					console.log(resp.status == 400)
					if (resp.status == 400) {
						other_payments = 0.00 
						return {"balance": other_payments}
					}
					// Return the response as JSON
					return resp.json();
				})
					.then(function (data) {
					other_payments = (data?.balance);
				})
					.catch(error => {
					// Handle errors
					console.error('Fetch other payments error:', error);
				});} catch (e) {
					console.log(e)
				}

			console.log("other payments " + other_payments)

			program_url = url + "&a_balance_type=RXPROGRAM"	
			try {
				await fetch(program_url, {
					method: 'GET', // or 'POST', 'PUT', etc.
					headers: headers,
				})
					.then(function (resp) {
					// Return the response as JSON
					if (resp.status == 400) {
						rx_and_other_payments = 0.00 
						return {"balance": rx_and_other_payments}
					}
					return resp.json();
				})
					.then(function (data) {
					rx_and_other_payments = (data?.balance);
				})
					.catch(error => {
					// Handle errors
					console.error('Fetch rx and other payments error:', error);
				});} catch (e) {
					console.log(e)
				}

			console.log("rx and other payments " + rx_and_other_payments)
			let available_balance_before_update
			program_url = url + "&a_balance_type=AVAILABLEBALANCE"	

			try {
				await fetch(program_url, {
					method: 'GET', // or 'POST', 'PUT', etc.
					headers: headers,
				})
					.then(function (resp) {
					// Return the response as JSON
					if (resp.status == 400) {
						available_balance_before_update = max_benefit_no_dec
						return {"balance": available_balance_before_update}
					}

					return resp.json();
				})
					.then(function (data) {
					available_balance_before_update = data?.balance;
				})
					.catch(error => {
					// Handle errors
					console.error('Fetch available balance before update error:', error);
				});}  catch (e) {
					console.log(e)
				}
			console.log("available balance " + available_balance_before_update)
			other_payments = (parseFloat(other_payments)/100).toFixed(2)
			rx_and_other_payments = (parseFloat(rx_and_other_payments)/100).toFixed(2)
			available_balance_before_update = (parseFloat(available_balance_before_update)/100).toFixed(2)
			storeValue("other_accumulated_amount_before_update", other_payments)  	
			storeValue("rx_and_other_accumulated_amount_before_update", rx_and_other_payments)  
			storeValue("available_amount_before_update", available_balance_before_update) 

			storeValue("other_accumulated_amount_after_update", "-")  	
			storeValue("rx_and_other_accumulated_amount_after_update", "-")  
			storeValue("available_amount_after_update", "-") 

		}

}