export default {
	dev_background_color: "#fef2f2",
	dev_primary_color: "#b91c1c",
	prod_background_color: "#FFFFFF",
	prod_primary_color: appsmith.theme.colors.primaryColor,
	update_app_user_permission: async (user_name, permission_level) => {
		if (!user_name) {
			showAlert("Please highlight user to update.");
			return;
		}
		
		if (!permission_level || !Number.isInteger(permission_level) ) {
			showAlert("Please enter a valid number for permission level");
			return;
		}
		
		if (permission_level < get_app_user_permission.data[0].permission_level ) {
			showAlert("Updated permission level cannot be lower than your current permission level, " +
								"which is " + get_app_user_permission.data[0].permission_level);
			return;
		}
		
		try {
			await update_app_user_permission.run({user_name: user_name, permission_level: permission_level});
			showAlert("Permission update successful.");
		} catch (e) {
			showAlert("Error updating permissions: ", e.message);
		}	
	},
	add_app_user_permission: async (user_name, permission_level) => {
		if (!user_name) {
			showAlert("Please input a valid username.");
			return;
		}
		
		if (!permission_level || !Number.isInteger(permission_level) ) {
			showAlert("Please select a permission level");
			return;
		}
		
		if (permission_level < get_app_user_permission.data[0].permission_level ) {
			showAlert("Selected permission level cannot have more privilege than your current permission level, " +
								"which is " + get_app_user_permission.data[0].permission_level);
			return;
		}
		
		try {
			await add_app_user_permission.run({user_name: user_name, permission_level: permission_level});
			showAlert("Permission update successful.");
		} catch (e) {
			showAlert("Error updating permissions: ", e.message);
		}	

	},	
}