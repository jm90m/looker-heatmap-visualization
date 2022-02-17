import React from "react";
import mapboxgl from 'mapbox-gl'

import BarChart from './barchart'
import './style.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
  Looker31SDK,
  Looker40SDK,
  LookerBrowserSDK,
} from '@looker/sdk'

import {
  BrowserSession,
  ApiSettings,
  IApiSettings,
  IApiSection
} from "@looker/sdk-rtl"

class customConfigReader extends ApiSettings {
  constructor(settings: IApiSettings) {
    super(settings)
  }
  /**
   * @returns an IApiSection object containing client_id and client_secret
   */
  readConfig(): IApiSection {
    return {
      client_id: "client_id",
      client_secret: "secret",
      redirect_uri: '123',
      looker_url: '123'
    }
  }
}

looker.plugins.visualizations.add({
  create: function (element: any, config: any) {

    const session = new BrowserSession(new customConfigReader({base_url: 'https://ddu.cloud.looker.com'} as IApiSettings))
    const sdk = new Looker31SDK(session)
    if (sdk) {
      console.log(sdk.me())
    }

    var container = element.appendChild(document.createElement('div'));
    container.id = 'map';

    // pk.eyJ1Ijoia3VraWJ1a2kiLCJhIjoiY2t5eWE3MndzMHFnZjJxcWw4bmZwMTZ5eCJ9.ruvAa4vZnra7yCCzw0T_Jg
    mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsZy1sb29rZXIiLCJhIjoiY2o0OTU1OWJzMGxqdTJxcGU0NzdlcnFodiJ9._sN1rteg8gA-wffpE7P7RQ';
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      center: [-120, 50],
      zoom: 2
    });


    this.map.on('load', () => {
      this.map.addSource('my-data', {
        'type': 'geojson',
        'data': {
          'type': 'FeatureCollection',
          'features': [{
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': []
            },
            'properties': {
              'title': 'Mapbox DC',
              'marker-symbol': 'monument'
            }
          }]
        }

      });

      this.map.addLayer({
        id: 'heatmap-layer-id',
        type: 'heatmap',
        source: 'my-data'
      });

      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });

      this.map.on('mouseenter', 'heatmap-layer-id', (e: any) => {
        // Change the cursor style as a UI indicator.
        this.map.getCanvas().style.cursor = 'pointer';

        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        // const popupInnerHtml = e.features[0].properties.description;
        const chartOptions = {
          x: (d: { letter: any; }) => d.letter,
          y: (d: { frequency: any; }) => d.frequency,
          // xDomain: d3.groupSort(alphabet, ([d]) => -d.frequency, d => d.letter), // sort by descending frequency
          yFormat: "%",
          yLabel: "↑ Frequency",
          color: "steelblue"

        }
        const data = [{letter: 'XYZ', frequency: 0.32}]
        const popupInnerHtml = BarChart(data, chartOptions)

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates).setDOMContent(popupInnerHtml).addTo(this.map);
      });

      this.map.on('mouseleave', 'heatmap-layer-id', () => {
        this.map.getCanvas().style.cursor = '';
        popup.remove();
      });

    });

  },
  updateAsync: function (data, element, config, queryResponse, details, done) {
    // console.log('data', data)
    // console.log('element', element)
    // console.log('config', config)
    // console.log('queryResponse', queryResponse)
    // console.log('details', details)
    // Grab the first cell of the data.
    // var firstRow = data[1];
    // var firstCell = firstRow[queryResponse.fields.dimensions[0].name];

    // Insert the data into the page.
    // this._textElement.innerHTML = LookerCharts.Utils.htmlForCell(firstCell);


    // TO MAKE THE MAP APPEAR YOU MUST
    // ADD YOUR ACCESS TOKEN FROM
    // https://account.mapbox.com

    this.map.on('load', () => {
      const myData = {
        'type': 'FeatureCollection',
        'features': []
      }
      for (let i = 0; i < data.length; i++) {
        const el = data[i];
        const feature = {
          'type': 'Feature',
          'geometry': {
            'type': 'Point',
            'coordinates': el['risk_events.location'].value
          },

          'properties': {
            'title': 'Mapbox DC',
            'marker-symbol': 'monument',
            'description': 'this is popup #' + i
          }
        }

        myData['features'].push(feature)
      }
      this.map.getSource('my-data').setData(myData);

    })
    done()
  }
})
