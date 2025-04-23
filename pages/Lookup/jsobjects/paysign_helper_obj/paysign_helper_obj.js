export default {
	maxes: {'1147308844': '22048.41',
					'1142839090': '20755.0',
					'1140962993': '20538.9',
					'1143615747': '20538.9',
					'1149036914': '20531.49',
					'1144420220': '19959.95',
					'1147016462': '19783.6',
					'1141298116': '19713.04',
					'1148584682': '19509.03',
					'1142017572': '19480.59',
					'1145686233': '19414.74',
					'1146986954': '18829.22',
					'1140750570': '18642.34',
					'1148076317': '18256.12',
					'1146612048': '18184.22',
					'1142402584': '17826.64',
					'1148205692': '17794.67',
					'1143335577': '17691.94',
					'1140807248': '17656.99',
					'1148715344': '17610.52',
					'1142971265': '17536.12',
					'1142234904': '17356.53',
					'1142541639': '17212.88',
					'1143819745': '17122.42',
					'1143357837': '16983.91',
					'1140827832': '16625.86',
					'1143033941': '16602.56',
					'1143711553': '16571.02',
					'1148893513': '16440.83',
					'1141286079': '15955.0',
					'1143551975': '15916.99',
					'1148154437': '15474.94',
					'1142337905': '15448.63',
					'1140573675': '15410.12',
					'1141875848': '15164.57',
					'1140215285': '15000.0',
					'1145019310': '15000.0',
					'1147210537': '14960.0',
					'1149332503': '14959.6',
					'1140195461': '14955.0',
					'1146930622': '14706.67',
					'1146800205': '14591.99',
					'1142155638': '14470.05',
					'1140596528': '14363.02',
					'1140054692': '14338.8',
					'1143815818': '13915.79'
				 },
	tens_up: { '1144946935': '13851.0',
						'1146965107': '13846.1',
						'1146878813': '13715.59',
						'1149422460': '13658.7',
						'1144215372': '13568.28',
						'1149295478': '13511.71',
						'1141853449': '13465.0',
						'1147281785': '13413.53',
						'1149576372': '13368.06',
						'1148599979': '13259.15',
						'1147848278': '13238.3',
						'1146733513': '13040.21',
						'1142962603': '12982.79',
						'1149860388': '12818.26',
						'1146798326': '12735.96',
						'1141555044': '12582.7',
						'1143434693': '12574.13',
						'1149490301': '12534.95',
						'1147662448': '12470.54',
						'1147774201': '12455.35',
						'1148963183': '12370.05',
						'1149846312': '12346.76',
						'1146553523': '12340.58',
						'1149653833': '12332.7',
						'1149955436': '12174.92',
						'1143201696': '11955.0',
						'1149104431': '11650.0',
						'1149949876': '11558.26',
						'1148292989': '11533.81',
						'1145885124': '11393.51',
						'1141807437': '11357.68',
						'1146674212': '11339.79',
						'1144615761': '11070.0',
						'1140279208': '10935.0',
						'1147055163': '10848.29',
						'1140208892': '10804.34',
						'1143728177': '10767.2',
						'1143049566': '10749.4',
						'1147851116': '10710.42',
						'1146480453': '10680.56',
						'1140420794': '10655.0',
						'1148778664': '10623.33',
						'1148329674': '10459.64',
						'1142793438': '10097.99',
						'1145009972': '10028.52',
						'1141589530': '10014.96',
						'1148716839': '10014.96',
						'1141984541': '10009.96',
					 },


	top_off_accumulator_balance: async (member_ids_to_accum_balance_dict) => {
		// 'use strict';
		let successful_updates = []
		let successful_updates_count = 0
		let requested_amount_exceeds_available = []
		let requested_amount_exceeds_available_count = 0		
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


		member_ids_to_accum_balance_dict = this.tens_up//this.maxes

		const username = connections_helper_obj.ps_prod_user;
		const password = connections_helper_obj.ps_prod_pw;

		const basicAuth = 'Basic ' + btoa(username + ':' + password);

		const headers = {
			"Authorization": basicAuth,
			"Content-Type": "application/x-www-form-urlencoded",
			"KEY-TOKEN": "HTI6*>R9ZBFU!01G4<^F94KT!$BL2R0$8N66S42~SC*LVKLPP1IIHOJ<%HAH" }

		member_ids_to_accum_balance_dict = {'1143815818': '13915.79'}

		for (let [member_id, accum_amt_submitted_for_update] of Object.entries(member_ids_to_accum_balance_dict)) {
			// console.log(member_id, accum_amt_submitted_for_update);
			// continue
			const orig_amt = accum_amt_submitted_for_update
			// check patient exists
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
						available_balance_before_update = max_benefit_no_dec
						return {"balance": available_balance_before_update}
					}
					return resp.json();
				})
					.then(function (data) {
					// check for negative balance 
					let message = data?.message 
					if (message.includes("negative")) isNegativeBalance = true
					available_balance_before_update = data?.balance;
				})
					.catch(error => {
					// Handle errors
					console.error('Fetch available balance before update error:', error);
				});}  catch (e) {
					console.log(e)
				}
			all_current_balances_no_updates.push(member_id + " : accumulator amount Client Program: " + accum_amt_client_program + " RX Program: " + accum_amt_rx_program + " Balance Available " + available_balance_before_update)

			// continue // stop here to get balance  

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
			let diff = max_benefit - accum_amt_submitted_for_update
			if (accum_amt_client_program == 0 ) {
				accum_amt_submitted_for_update =  Math.min(accum_amt_submitted_for_update, available_balance_before_update)
				accum_amt_submitted_for_update -= diff
			} else if (accum_amt_client_program > 0) {
				if (accum_amt_submitted_for_update > available_balance_before_update) {
					// amount over allowed - adjust it so that sum equals 15k but normally would stop process
					accum_amt_submitted_for_update = available_balance_before_update + accum_amt_client_program
					accum_amt_submitted_for_update -= diff
				} else {
					accum_amt_submitted_for_update += accum_amt_client_program
				}
			}
			console.log("accum_amt_submitted_for_update " + accum_amt_submitted_for_update)
			// remove decimals and add 00
			const accum_amt_submitted_for_update_arr = accum_amt_submitted_for_update.toString().split(".")
			let zeros 
			if (accum_amt_submitted_for_update_arr.length == 1) {
				zeros = 0  
			} else if (accum_amt_submitted_for_update_arr.length == 2) {
				zeros = accum_amt_submitted_for_update_arr[1].length
			} else {
				failed_updates.push(member_id + " There are more than one decimal in the amount. " + accum_amt_submitted_for_update.toString())
				failed_updates_count += 1
				showAlert((member_id + " There are more than one decimal in the amount. " + accum_amt_submitted_for_update.toString()))
				continue								
			}

			if (zeros != 0) {
				if (zeros == 1) {
					accum_amt_submitted_for_update = accum_amt_submitted_for_update * 100
				} else if (zeros == 2) {
					accum_amt_submitted_for_update = accum_amt_submitted_for_update * 100
				} else {
					// should not happen
					failed_updates.push(member_id + " There are more than one decimal in the amount. " + accum_amt_submitted_for_update.toString())
					failed_updates_count += 1
					showAlert((member_id + " There are more than one decimal in the amount. " + accum_amt_submitted_for_update.toString()))
					continue								
				}
			} else {
				accum_amt_submitted_for_update = accum_amt_submitted_for_update * 100
			}		

			console.log("accumulator amount to be submitted for balance update: " + accum_amt_submitted_for_update  + " " + member_id)
			showAlert("accumulator amount to be submitted for balance update: " + accum_amt_submitted_for_update)

			// continue // stop here for testing

			try { 
				await update_accumulator_ps.run({ member_id: member_id, balance: accum_amt_submitted_for_update })
				// successful_updates.push(member_id + " updated successfully. Client Program Accum before: " + accum_amt_client_program + " RX Program Accum before: " + accum_amt_rx_program + " Balance Available Accum before: " + available_balance_before_update + " New Accum Balance submitted for update " + accum_amt_submitted_for_update + " Balance Available Accum after update: " + available_balance_after_update)
				successful_updates.push(member_id + " updated successfully. Client Program Accum before: " + accum_amt_client_program + " RX Program Accum before: " + accum_amt_rx_program + " Balance Available Accum before: " + available_balance_before_update + " New Accum Balance submitted for update " + accum_amt_submitted_for_update + " original request amount " + orig_amt)
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