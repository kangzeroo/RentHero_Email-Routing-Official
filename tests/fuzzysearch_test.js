const Fuzzy = require('../api/fuzzysearch/fuzzysearch_api')

console.log('======================= FUZZY SEARCH ADDRESS =========================')
console.log('Starting fuzzysearch by address...')
const found_addresses = ["333 chestnut"]
const real_addresses = [
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "3e6601d9-643d-405e-85f7-5f3dbb92efc0",
            "street_code": "3333",
            "street_name": "Chestnut Street",
            "formatted_address": "3333 Chestnut St, Philadelphia, PA 19104, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "3e6601d9-643d-405e-85f7-5f3dbb92efc0",
            "street_code": "3333",
            "street_name": "Chestnut Street",
            "formatted_address": "3333 Chestnut St, Philadelphia, PA 19104, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "e505189f-63bf-4fe9-abba-b4e9f7809190",
            "street_code": "330",
            "street_name": "Spruce Street",
            "formatted_address": "330 Spruce St, Waterloo, ON N2L 3M7, Canada"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "e505189f-63bf-4fe9-abba-b4e9f7809190",
            "street_code": "330",
            "street_name": "Spruce Street",
            "formatted_address": "330 Spruce St, Waterloo, ON N2L 3M7, Canada"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "1dd6d27a-d717-4558-aaa3-73fc1658b837",
            "street_code": "2226",
            "street_name": "Massachusetts Avenue",
            "formatted_address": "2226 Massachusetts Ave, Cambridge, MA 02140, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "1dd6d27a-d717-4558-aaa3-73fc1658b837",
            "street_code": "2226",
            "street_name": "Massachusetts Avenue",
            "formatted_address": "2226 Massachusetts Ave, Cambridge, MA 02140, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "fe251641-404b-4908-9f33-1dd3ac556ade",
            "street_code": "338",
            "street_name": "Boylston Street",
            "formatted_address": "338 Boylston St, Boston, MA 02116, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "fe251641-404b-4908-9f33-1dd3ac556ade",
            "street_code": "338",
            "street_name": "Boylston Street",
            "formatted_address": "338 Boylston St, Boston, MA 02116, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "73bd37ac-c5a6-4bb9-aa75-e3574d2f732d",
            "street_code": "333",
            "street_name": "Massachusetts Avenue",
            "formatted_address": "333 Massachusetts Ave, Arlington, MA 02474, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "73bd37ac-c5a6-4bb9-aa75-e3574d2f732d",
            "street_code": "333",
            "street_name": "Massachusetts Avenue",
            "formatted_address": "333 Massachusetts Ave, Arlington, MA 02474, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "65e5438e-467e-442b-b7c6-61276a2febc2",
            "street_code": "333",
            "street_name": "Massachusetts Avenue",
            "formatted_address": "333 Massachusetts Ave, Arlington, MA 02474, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "65e5438e-467e-442b-b7c6-61276a2febc2",
            "street_code": "333",
            "street_name": "Massachusetts Avenue",
            "formatted_address": "333 Massachusetts Ave, Arlington, MA 02474, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "8e7e2423-b7d2-4c56-89a5-65cf625f7980",
            "street_code": "333",
            "street_name": "Massachusetts Avenue",
            "formatted_address": "333 Massachusetts Ave, Arlington, MA 02474, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "8e7e2423-b7d2-4c56-89a5-65cf625f7980",
            "street_code": "333",
            "street_name": "Massachusetts Avenue",
            "formatted_address": "333 Massachusetts Ave, Arlington, MA 02474, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "595060c2-73ea-44ec-b527-9c4a85edbc91",
            "street_code": "12131",
            "street_name": "South Dixie Highway",
            "formatted_address": "12131 S Dixie Hwy, Miami, FL 33156, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "595060c2-73ea-44ec-b527-9c4a85edbc91",
            "street_code": "12131",
            "street_name": "South Dixie Highway",
            "formatted_address": "12131 S Dixie Hwy, Miami, FL 33156, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "cbf4c001-6679-45d3-a7b2-9b4422d731f9",
            "street_code": "5126",
            "street_name": "Chestnut Street",
            "formatted_address": "5126 Chestnut St, Philadelphia, PA 19139, USA"
        },
        {
            "proxy_email": "heffe@myrenthelper.com",
            "ad_id": "cbf4c001-6679-45d3-a7b2-9b4422d731f9",
            "street_code": "5126",
            "street_name": "Chestnut Street",
            "formatted_address": "5126 Chestnut St, Philadelphia, PA 19139, USA"
        }
    ]

const results = Fuzzy.searchAddresses(
  found_addresses,
  real_addresses
)
console.log(results)



console.log('======================= FUZZY SEARCH URL =========================')
console.log('Starting fuzzysearch by url...')
const found_urls = [
  "https://ant.design/components/list/",
  "https://ant.design/components/list/34546"
]
const real_urls = [
    {
        "proxy_email": "heffe@myrenthelper.com",
        "ad_id": "e505189f-63bf-4fe9-abba-b4e9f7809190",
        "link": "https://ant.design/components/list/"
    },
    {
        "proxy_email": "heffe@myrenthelper.com",
        "ad_id": "e505189f-63bf-4fe9-abba-b4e9f7809190",
        "link": "https://ant.design/components/list/"
    },
    {
        "proxy_email": "heffe@myrenthelper.com",
        "ad_id": "1dd6d27a-d717-4558-aaa3-73fc1658b837",
        "link": "asdadasdadasd"
    },
    {
        "proxy_email": "heffe@myrenthelper.com",
        "ad_id": "1dd6d27a-d717-4558-aaa3-73fc1658b837",
        "link": "asdadasdadasd"
    },
    {
        "proxy_email": "heffe@myrenthelper.com",
        "ad_id": "fe251641-404b-4908-9f33-1dd3ac556ade",
        "link": "https://kijiji.ca"
    },
    {
        "proxy_email": "heffe@myrenthelper.com",
        "ad_id": "fe251641-404b-4908-9f33-1dd3ac556ade",
        "link": "pornhub.com"
    },
    {
        "proxy_email": "heffe@myrenthelper.com",
        "ad_id": "fe251641-404b-4908-9f33-1dd3ac556ade",
        "link": "https://kijiji.ca"
    },
    {
        "proxy_email": "heffe@myrenthelper.com",
        "ad_id": "fe251641-404b-4908-9f33-1dd3ac556ade",
        "link": "pornhub.com"
    }
]

const results2 = Fuzzy.searchURLs(
  found_urls,
  real_urls
)
console.log(results2)
