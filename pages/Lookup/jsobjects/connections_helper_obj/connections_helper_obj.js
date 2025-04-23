export default {
	// replace db_url with api url here only - api calls should reference url here for easy updates
	db_url: "https://vcqwjw4ew6gxw3iphqia3lfqmy0pogqi.lambda-url.ap-south-1.on.aws",
	ps_url: this.ps_prod,
	hemlibra_prod: "http://web-api.netswitchcard.com",
	hemlibra_dev: "http://hemlibra-api.netswitchcard.com:4001",
	xolair_dev_url: "http://xolair-api.netswitchcard.com",
	xolair_prod_url: "https://web-xolair-api.netswitchcard.com",
	ps_prod: "https://copay-portalapi.paysign.net/copay/api/v1",
	ps_dev: "https://copay-portalapi-stage.aws.paysign.com/copay/api/v1",
	ps_prod_domain: "https://vcqwjw4ew6gxw3iphqia3lfqmy0pogqi.lambda-url.ap-south-1.on.aws",
	ps_prod_program: "64",
	ps_prod_sponsor: '8585511152',
	ps_prod_group: "100073A",
	ps_prod_user: "COPAY_USER",
	ps_prod_pw: "g|w.M2=JAAA121lsKAsS1qw?8'ew-H",
	ps_key_token: "HTI6*>R9ZBFU!01G4<^F94KT!$BL2R0$8N66S42~SC*LVKLPP1IIHOJ<%HAH",	
	update_environment_url: async (environment_name) => {
		//use async-await or promises
		if ("PRODUCTION" == environment_name.trim().toUpperCase()) {
			showAlert("Xolair production environment currently unavailable");
			return;
			// storeValue("db_url", this.hemlibra_prod)
			// storeValue("ps_url", this.ps_prod)
			// appsmith.theme.colors.backgroundColor = "#ecfdf5"; // background color #ecfdf5 , 
		} else if ("DEVELOPMENT" == environment_name.trim().toUpperCase()){
			showAlert("App is currently defaulted to Xolair Dev");
			// storeValue("db_url", this.xolair_url)
			// storeValue("ps_url", this.ps_dev)
			// appsmith.theme.colors.backgroundColor = "#FFC0CB";
			return;
		}
	},

}