import React from 'react'
import Zone from './Zone'

export default function ParkZones({ parkZones }) {
  
  return (
    <div className='grid'>
      {parkZones.map(row => {    
          return <Zone key={row.id} zone={row}/>        
      })}
    </div>
  )
}
