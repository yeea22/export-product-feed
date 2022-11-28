const configFile = require("./input/product-feed-elastic.json");

// get fs module for creating write streams
const fs = require("fs");

// get the Console class
const { Console } = require("console");

const myLogger = new Console({
  stdout: fs.createWriteStream("./output/output.csv"), //normal log
  stderr: fs.createWriteStream("./output/info.txt"),   //error-info-warning log
});


// IGNORE: header, attributes, attributes_value, digital_assets
// const header = configFile[0];
// myLogger.log(header)
// const attributes = configFile[1];
// myLogger.log(attributes)
// const attributes_values = configFile[2];
// myLogger.log(attributes_values)
// const digital_assets = configFile[3];
// myLogger.log(digital_assets)
const products = configFile[4];
//myLogger.log(products)


// Define yesAttribute List
var yesAttributes = [
  "Website Category L1 Reference",
  "Website Category L1 Desc",
  "Website Category L2 Reference",
  "Website Category L2 Desc",
  "Website Category L3 Reference",
  "Website Category L3 Desc",
  "salsify:id",
  "S2K Item Number",
  "Product Name",
  "Division Name",
  "Division Number",
  "Inventory Class Name",
  "Inventory Class Number",
  "Manufacturer",
  "Manufacturer Description",
  "Manufacturer Product Number",
  "Manufacturer Reference",
  "Primary Image",
  "Brand",
  "Brand Reference",
  "Branded Product Name",
  "Complimentary Items",
  "Discontinued Flag",
  "Do Not Reorder",
  "Marketing Bullets",
  "Marketing Short Description",
  "Material",
  "Preferred Vendor",
  "Publish to Web",
  "UNSPSC",
  "UPC-12",
  "UPC-12 Victoria Bay",
  "UPC-14",
  "UPC-14 Victoria Bay",
  "Victoria Bay"
]


// Define removeAttribute list - to know which attributes are removed
var noAttributes = [];
for (let i = 0; i < products.products.length; i++) {
  Object.entries(products.products[i]).forEach(([key, val]) => {
    if (!noAttributes.includes(key) && !yesAttributes.includes(key)) {
      if (!yesAttributes.includes(key))
        noAttributes.push(key);
    }
  })
}


// Define finalAttributes - for output;
var finalAttributes = yesAttributes;


// Export Header 1st row (listing all the categories/columns)
var headerString = '';
for (let j = 0; j < finalAttributes.length; j++) {
  headerString += '"' + finalAttributes[j].toString().replace(/["]+/g, '') + '",';
}
myLogger.log(headerString.slice(0, -1)); //remove last char [comma]


// Define websiteCategory list (ie, WCL1001 Foodservices Products)
var websiteCategory = products.products.filter(function (el) {
  return el["salsify:id"].toString().startsWith("WCL");
});


// Lookup Website Category Name
function getWebsiteCategoryName(wclId) {
  var found = websiteCategory.find(product => product["salsify:id"] === wclId);
  if (found)
    return found["Product Name"];
}


// RULES: product
function skipProduct(productId) {
  // WCL=WebCategory, M=Manufacturer, B=Brand
  if (productId.startsWith("WCL") || productId.startsWith("M") || productId.startsWith("B"))
    return true;
}


// Define each line item/products
for (let i = 0; i < products.products.length; i++) {  // 77148
  let lineString = '';

  // to skip product or not
  if (skipProduct(products.products[i]["salsify:id"]))
    continue;

  // loop thru finalAttributes to find product-attribute's value
  for (let j = 0; j < finalAttributes.length; j++) {

    // website category attributes
    if (finalAttributes[j].includes("Website Category")) {
      if (finalAttributes[j].includes("Reference")) {
        if (products.products[i][finalAttributes[j]] === undefined) {
          lineString += '"",';
          lineString += '"",';
        } else {
          lineString += '"' + products.products[i][finalAttributes[j]] + '",';
          lineString += '"' + getWebsiteCategoryName(products.products[i][finalAttributes[j]]) + '",';
        }
      }
      continue;
    }

    // primary image
    if (finalAttributes[j].includes("Primary Image")) {
      let digitalAssetId = products.products[i]["Primary Image"];
      if (digitalAssetId === undefined) {
        lineString += '"",';
      }
      else {
        let salsifyId = products.products[i]["salsify:id"];
        lineString += `"https://s3.amazonaws.com/imperialdade.com/apps/catalog/digital-assets/${salsifyId}/primary/${digitalAssetId}-100x100.jpg",`
      }
      continue;
    }

    // other attributes
    if (products.products[i][finalAttributes[j]] === undefined || products.products[i][finalAttributes[j]] === null) {
      lineString += '"",';
    }
    else {
      lineString += '"' + products.products[i][finalAttributes[j]].toString().replace(/["]+/g, '') + '",';
    }

  }
  // Export each product line row 
  myLogger.log(lineString.slice(0, -1));  //remove last char  [comma]
}


myLogger.warn("----- FINAL -----", finalAttributes.length);
myLogger.warn(JSON.stringify(finalAttributes, null, 2));

myLogger.warn("----- NO -----", noAttributes.length);
myLogger.warn(JSON.stringify(noAttributes.sort(), null, 2));

//myLogger.warn("----- WCL Categories -----", websiteCategory.length);
//myLogger.warn(JSON.stringify(websiteCategory, null, 2));
