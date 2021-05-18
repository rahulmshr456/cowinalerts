
const axios = require('axios');
const _ = require('lodash');
const notifier = require('node-notifier');
const inquirer = require('inquirer');
const states = require('./data/states.js');

let count = 0;

getAppointmentDate = () => {
	const today = new Date();
	today.setDate(today.getDate() + 1);
	let dd = today.getDate();
	let mm = today.getMonth()+1; 
	const yyyy = today.getFullYear();
	if(dd<10) 
	{
	    dd='0'+dd;
	} 

	if(mm<10) 
	{
	    mm='0'+mm;
	} 

	return dd+'-'+mm+'-'+yyyy;
}

const sendAlerts = ({name,address,available_capacity}) => {
	notifier.notify({
	  title: `Cowin slots available at ${name}`,
	  message: `Address: ${address}, Capacity: ${available_capacity}`
	});
}

const fetchEighteenPlus = (data) => {
	console.log(`Searching for appointments ${count}`);
	count++;
	let flag = false;
	for(let i=0;i<data.length;i++){
		const {name,address} = data[i];
		for(let j=0;j<data[i].sessions.length;j++){
			const {available_capacity,min_age_limit} =  data[i].sessions[j];
			if(available_capacity >0 && min_age_limit === 18){
				sendAlerts({name,address,available_capacity});
				flag= true;
			}
		}
	}

	if(!flag){
		console.log('No appointments found');
	}
}


const fetchAppointments = async ({district}) => {
	const date = getAppointmentDate();
	const { data:{centers} } = await axios.get(`https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district}&date=${date}`, {
	    "headers": {
		  'accept': 'application/json, text/plain, */*',
		  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
		  }
	  })
	fetchEighteenPlus(centers)
}

const fetchDistricts = async ({state}) => {
	const { data: { districts} } = await axios.get(`https://cdn-api.co-vin.in/api/v2/admin/location/districts/${state}`, {
    "headers": {
	  'accept': 'application/json, text/plain, */*',
	  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
	  }
  })
	return districts;
}

const Start = async () => {
	const stateQuestion = [{
		type:'list',
		name: 'state',
		message:'Select your state',
		choices:states
	}]
	const selectedState = await inquirer.prompt(stateQuestion);
	const district = await fetchDistricts(selectedState);
	const districtsOptions = district.map(data=>({
			name: data.district_name,
			value: data.district_id
		}));
	const districtQuestion = [{
		type:'list',
		name: 'district',
		message:'Select your state',
		choices:districtsOptions
	}]
	const selectedDistrict = await inquirer.prompt(districtQuestion);
	
	setInterval(()=>{
		fetchAppointments(selectedDistrict);	
	},60000)

	fetchAppointments(selectedDistrict);
	
}

Start();
  
