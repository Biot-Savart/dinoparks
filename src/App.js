import React, {useState, useEffect} from 'react';
import axios from 'axios';
import dateFormat from 'dateformat';
import './App.css';
import ParkZones from './components/ParkZones';

const NUDLS_STORAGE_KEY = 'dinoparks.nudls';
const PARKZONES_STORAGE_KEY = 'dinoparks.parkzones';
const DINOS_STORAGE_KEY = 'dinoparks.dinos';

function App() {
  const [nudls, setNudls] = useState([]);
  const [dinos, setDinos] = useState({dinos: []});
  const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
	const timestamp = dateFormat(new Date(), "d mmmm yyyy");

  const initial_data = [];
  let count = 0;
  for (let row = 1; row <= 16; row++) {
		initial_data[count] = {value: row, class: "label", id: "row" + row};
		count++;
    for (let col = 0; col < alphabet.length; col++) {
      initial_data[count] = {id: alphabet[col] + row, status: ''};
      count++;
    }
  }

	initial_data[count] = {value: "", class: "label", id: "col"};
	count++;
	for (let col = 0; col < alphabet.length; col++) {
		initial_data[count] = {value: alphabet[col], class: "label", id: "col" + col};
		count++;
	}

  const [parkZones, setParkZones] = useState(initial_data);

  const getData= async ()=>{
    await axios('https://dinoparks.net/nudls/feed')
      .then(response => {
        const data = response.data.reverse();
        setNudls(data);
				analyzeNudls(data);
      })
			.catch(err => {
				console.log(err);
			});
  }

  useEffect(()=>{
     getData();
  },[]);

  useEffect(() => {
    	localStorage.setItem(NUDLS_STORAGE_KEY, JSON.stringify(nudls));
  }, [nudls]); 

  useEffect(() => {
    localStorage.setItem(PARKZONES_STORAGE_KEY, JSON.stringify(parkZones));
  }, [parkZones]);

  useEffect(() => {
    localStorage.setItem(DINOS_STORAGE_KEY, JSON.stringify(dinos));
  }, [dinos]);

  function analyzeNudls(data) {
    for (const n of data) {
      switch(n.kind) {
        case "dino_added":
          dinoAdded(n);
          break;
        case "dino_removed":
          dinoRemoved(n);
          break;
        case "dino_location_updated":
          dinoLocationUpdated(n);
          break;
        case "dino_fed":
          dinoFed(n);
          break;
        case "maintenance_performed":
          maintenancePerformed(n);
          break;
        default:
          break;
      }
    }

  }

  function dinoAdded(n) {
		let newDinos = dinos; 
		let dino = newDinos.dinos.find(d => d.id === n.id);

		if (dino === undefined) {
			newDinos.dinos.push(n);
			setDinos(newDinos);
		}			
  }

  function dinoRemoved(n) {
    const newParkZones = [...parkZones];
    //remove from old zone
    const oldZone = newParkZones.find(z => z.dino && z.dino.id === n.dinosaur_id);
    if (oldZone) {
      oldZone.dino = null; 
      oldZone.status = "";
    }

		setParkZones(newParkZones);

		//remove Dino
		let newDinos = dinos;
		newDinos.dinos = newDinos.dinos.filter(d => d.id !== n.dinosaur_id);
		
    setDinos(newDinos);
  }

  function dinoLocationUpdated(n) {
    const newParkZones = [...parkZones];
    //remove from old zone
    const oldZone = newParkZones.find(z => z.dino && z.dino.id === n.dinosaur_id);
    if (oldZone) {
      oldZone.dino = null; 
      oldZone.status = stillDigesting(oldZone) ? "safe" : "unsafe";
    }

    //add to new zone    
    const zone = newParkZones.find(z => z.id === n.location);
    const dino = dinos.dinos.find(d => d.id === n.dinosaur_id);
    if (dino) {
      zone.dino = dino;
      zone.status = stillDigesting(zone) ? "safe" : "unsafe";
    }
    
    setParkZones(newParkZones);    
  }

  function dinoFed(n) {
    const newParkZones = [...parkZones];
    
    const zone = newParkZones.find(z => z.dino && z.dino.id === n.dinosaur_id);
    if (zone) { 
      zone.dino.feedTime = n.time;
			zone.status = stillDigesting(zone) ? "safe" : "unsafe";
    }

		setParkZones(newParkZones);
  }

  function maintenancePerformed(n) {
    const newParkZones = [...parkZones];
		const zone = newParkZones.find(z => z.id === n.location);
		zone.maintenanceTime = n.time;
		const status = stillDigesting(zone) ? "safe" : "unsafe";
		zone.status = checkShouldMaintain(zone) ? " needMaintenance " + status : "";

		setParkZones(newParkZones);
  }

	function checkShouldMaintain(zone) {
		if (!zone.maintenanceTime)
			return false;

			//Each zone in the grid needs maintenance every 30 days.
			const pastTime = new Date(zone.maintenanceTime);
			const now = new Date();
			const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
			const timeDiffInMs = now.getTime() - pastTime.getTime();

			if(timeDiffInMs >= thirtyDaysInMs)
				return true;

			return false;
	}

	function stillDigesting(zone)
	{
		if (!zone.dino)
			return true;

		if (zone.dino.herbivore)
			return true;

		//not been fed so very hungry
		if (!zone.dino.feedTime)
			return false;

		const feedTime = new Date(zone.dino.feedTime);
		const now = new Date();
		const digetsPeriodInMs = zone.dino.digestion_period_in_hours * 60 * 60 * 1000;
		const timeDiffInMs = now.getTime() - feedTime.getTime();
		
		if(timeDiffInMs >= digetsPeriodInMs)
			return false;
		
		return true;
	}

  return (
    <div className='content'>
			<div className='header'>
				<h1>Park Zones</h1>
				<h2>{timestamp}</h2>
			</div>
      	<ParkZones parkZones={parkZones}/>
    </div>
  );
}

export default App;
