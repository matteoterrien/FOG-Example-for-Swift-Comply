import "./style.css";
import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle.js";
import * as locator from "@arcgis/core/rest/locator.js";
import Search from "@arcgis/core/widgets/Search.js";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";

const Template = {
  // autocasts as new PopupTemplate()
  title: "FOG in {name}",
  content: [
    {
      // It is also possible to set the fieldInfos outside of the content
      // directly in the popupTemplate. If no fieldInfos is specifically set
      // in the content, it defaults to whatever may be set within the popupTemplate.
      type: "fields",
      fieldInfos: [
        {
          fieldName: "business_address",
          label: "Address",
        },
        {
          fieldName: "compliance_status",
          label: "Compliance Status",
        },
        {
          fieldName: "inspections_count",
          label: "Inspections Count",
          format: {
            digitSeparator: true,
            places: 0,
          },
        },
        {
          fieldName: "last_inspected_on",
          label: "Last Inpection On",
        },
        {
          fieldName: "last_pumped_on",
          label: "Last Pumped On",
        },
        {
          fieldName: "reference_no",
          label: "Reference Number",
        },
        {
          fieldName: "updated_date",
          label: "Data Updated On",
        },
      ],
    },
  ],
};

// Create the Map
const map = new Map({
  basemap: "streets-navigation-vector",
});

// Create the MapView
const view = new MapView({
  container: "viewDiv",
  map: map,
  center: [-100, 40],
  zoom: 4,
});

// Search Bar Widget
const searchWidget = new Search({
  view: view,
});

// Add the search widget to the top right corner of the view
view.ui.add(searchWidget, {
  position: "top-right",
});

const toggle = new BasemapToggle({
  // 2 - Set properties
  view: view, // view that provides access to the map's 'topo-vector' basemap
  nextBasemap: "hybrid", // allows for toggling to the 'hybrid' basemap
});

// Add widget to the top right corner of the view
view.ui.add(toggle, "top-right");

/********************
 * Add Graphics Layer
 ********************/

const apiKey = "e99df8c3bb4382bef59a61dbd7efcbac";
const apiUrl = "/api/v1/establishments/";

const requestOptions = {
  method: "GET",
  headers: {
    Authorization: `Bearer ${apiKey}`,
  },
};

fetch(apiUrl, requestOptions)
  .then((response) => {
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Data not found");
      } else if (response.status === 500) {
        throw new Error("Server error");
      } else {
        throw new Error("Network response was not ok");
      }
    }
    return response.json();
  })
  .then(async (result) => {
    // console.log(result);

    const graphics_arr = [];

    for (const element of result.data) {
      let point = {
        x: null,
        y: null,
      };

      const lat = element.attributes.postal_addresses[0].latitude;
      const lon = element.attributes.postal_addresses[0].longitude;

      if (lat === null || lon === null) {
        const serviceURL =
          "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

        const params = {
          address: {
            SingleLine: element.attributes.business_address,
          },
        };

        const locations = await locator.addressToLocations(serviceURL, params);

        const coordinates = locations[0].location;

        // If the address isn't real. Skip it.
        if (locations.length === 0) {
          return;
        }

        point.x = coordinates.x;
        point.y = coordinates.y;

        // console.log(
        //   `Address: ${element.attributes.business_address}, Coordinates: [${point.x}, ${point.y}]`
        // );
      } else {
        point.x = Number(lon);
        point.y = Number(lat);
      }

      // console.log(element.attributes);

      const symbol = {
        type: "simple-marker", // autocasts as new SimpleMarkerSymbol()
        style: "circle",
        color:
          element.attributes.compliance_status === "non_compliant"
            ? "red"
            : element.attributes.compliance_status === "no_devices"
            ? "blue"
            : element.attributes.compliance_status === "compliant"
            ? "green"
            : element.attributes.compliance_status !== "overdue_service"
            ? "yellow"
            : "gray",
        size: "16px",
        outline: {
          color: "black",
          width: 0,
        },
      };

      let graphic = new Graphic({
        geometry: new Point(point),
        symbol: symbol,
        attributes: {
          name: element.attributes.name,
          business_address: element.attributes.business_address,
          compliance_status: element.attributes.compliance_status,
          inspections_count: element.attributes.inspections_count,
          last_inspected_on: element.attributes.last_inspected_on,
          last_pumped_on: element.attributes.last_pumped_on,
          reference_no: element.attributes.reference_no,
          updated_date: element.attributes.updated_date,
        },
        popupTemplate: Template,
      });

      graphics_arr.push(graphic);
    }

    let layer = new GraphicsLayer({
      graphics: graphics_arr,
    });

    map.add(layer);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
