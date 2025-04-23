export default {
	parse_change_dict () {
		// assumes left and right dictionaries have same keys  l, r
		let l = [1]
		let r = [2]
		const lkeys = Object.keys(l)
		const rkeys = Object.keys(r)
		const key_diff = _.difference(lkeys,rkeys)
		return key_diff
	},
	async log_change () {
		//	write code here
		//	this.myVar1 = [1,2,3]
	},
	async log_error () {
		//	use async-await or promises
		//	await storeValue('varName', 'hello world')
	}
}