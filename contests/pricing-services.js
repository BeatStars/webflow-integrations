import { pricingQuery } from './queries.js'

export async function getProducersPlans(graphUrl, token) {
  let options = {}

  if (token) {
    options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: pricingQuery })
    }
  }

  options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: pricingQuery })
  }

  const req = await fetch(graphUrl, options)
  const res = await req.json()
  const plansData = res.data.subscriptionProducts

  let plans = plansData.filter((plans) => { return plans.audienceGroup === 'PRODUCER'; });

  return plans
}

export async function getSinglePlan(planName, token, url) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: pricingQuery })
  }

  const req = await fetch(url, options)
  const res = await req.json()
  const plansData = res.data.subscriptionProducts

  let plansArray = plansData.filter((plans) => { return plans.title === planName; });
  if (plansArray.length = 1) return plansArray[0]
  if (plansArray.length = 0) return false
  return plansArray
}

export function getCurrencyType(value, currency) {
  if (value === undefined) {
    return (0).toLocaleString('en-US', { style: 'currency', currency: currency })

  }
  return value.toLocaleString('en-US', { style: 'currency', currency: currency })
}

export function createAnnualPlans(plans) {
  let annualPlans = []

  plans.forEach((item, index) => {
    if (item.title === "Free") return; //Remove Free plan from new Array
    if (item.plans.length === 1) {
      item = {
        ...item,
        pricing: item.plans[0]
      }
      annualPlans.push(item)
      return
    }
    item = {
      ...item,
      pricing: item.plans[1]
    }
    annualPlans.push(item)
  });
  //Return new Array with annual plan only
  return annualPlans;
}
export function createMonthlyPlans(plans) {
  let monthlyPlans = []
  plans.forEach((item, index) => {
    if (item.title === "Free") return; //Remove Free plan from new Array
    let planDuration = item.plans[0].duration.unit
    if (planDuration !== 'MONTH') return monthlyPlans.push({
      ...item,
      pricing: item
        .plans[0],
      is_available: 0
    })
    item = {
      ...item,
      pricing: item.plans[0]
    }
    monthlyPlans.push(item)
  })
  return monthlyPlans
}
