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
      label
      new
      available
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
    __typename
  }
}
  `
