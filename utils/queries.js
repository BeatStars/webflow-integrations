export const getMemberQuery = `
  query getMember {
  publishingDeal{
                status
                society
                ipiNumber
              }
    member {
      id
      account{
        accountType
        subscriptionPlan
        subscriptions
        email
      }
      details {
        firstName
        lastName
        __typename
      }
      profile {
        memberId
        avatar {
          sizes {
            small
          }
        }
        location
        displayName
        username
      }
    }
  }
`

export const pricingQuery = `
query subscriptionProducts($productGroup: ProductGroup, $onlyAvailable: Boolean = false, $audienceGroup: AudienceGroup) {
  subscriptionProducts(
    productGroup: $productGroup
    onlyAvailable: $onlyAvailable
    audienceGroup: $audienceGroup
  ) {
    ...SubscriptionProduct
    __typename
  }
}
fragment SubscriptionProduct on ExposedSubscriptionProduct {
  title
  subTitle
  featureListTitle
  formerlyDescrption
  audienceGroup
  productGroup
  features {
    feature
    label
    productFeatureValueType
    value
    new
    __typename
  }
  primaryFeatures {
    feature
    text
    new
    __typename
  }
  subscriptionFeatures {
    feature
    label
    new
    available
    availableInTrial
    __typename
  }
  plans {
    available
    chargebeeId
    duration {
      unit
      value
      __typename
    }
    flags {
      flag
      label
      __typename
    }
    price {
      amount
      currency
      __typename
    }
    pricePerMonth {
      amount
      currency
      __typename
    }
    subscribed
    __typename
  }
  trialEligibility {
    eligible
    primaryFeatures {
      text
      feature
      __typename
    }
    features {
      feature
      value
      productFeatureValueType
      __typename
    }
    duration {
      trialDurationUnit
      trialDurationValue
      __typename
    }
    __typename
  }
  __typename
}
`
