import React from 'react'
import { useSelector } from 'react-redux'

const Dashboard = () => {

    const { user } = useSelector( state => state.auth.user)

    console.log(user)

  return (
    <div>
      DASHBOARD
    </div>
  )
}

export default Dashboard
