import React from 'react'

export default function Zone({ zone }) {
  //debugger;
  return (
    <div className={`zone ${zone.status} ${zone.class}`} id={zone.id} title={zone.dino && JSON.stringify(zone.dino)}>{zone.value}</div>
  )
}
