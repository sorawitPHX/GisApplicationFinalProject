let travelPlaceType = []
const accommodationFeatureUrl = 'https://services5.arcgis.com/KC8LEU0fySeXG2Oq/arcgis/rest/services/AccommodationFeatureNew/FeatureServer'
const travelPlaceCsvUrl = location.origin + '/data/สถานที่ท่องเที่ยว.csv'
document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/data/ประเภทสถานที่ท่องเที่ยว.csv')
    let data = await response.text()
    data = data.split('\n').map(row => row.split(',').map(cell => cell.trim()))
    const header = data.shift()
    data = data.filter(row => row.length == header.length)
    for (const row of data) {
        let obj = {}
        for (let i = 0; i < row.length; i++) {
            obj[header[i]] = row[i]
        }
        travelPlaceType.push(obj)
    }
})

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/widgets/Search",
    "esri/widgets/Editor",
    "esri/renderers/UniqueValueRenderer",
    "esri/layers/CSVLayer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/widgets/LayerList",
    "esri/widgets/Legend",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Home",
    "esri/widgets/Expand",
    "esri/layers/GraphicsLayer",
    "esri/widgets/Sketch",
    "esri/symbols/TextSymbol"
], function (
    Map,
    MapView,
    FeatureLayer,
    Search,
    Editor,
    UniqueValueRenderer,
    CSVLayer,
    PictureMarkerSymbol,
    LayerList,
    Legend,
    BasemapGallery,
    Home,
    Expand,
    GraphicsLayer,
    Sketch,
    TextSymbol
) {
    const sketchGraphicLayer = new GraphicsLayer({
        title: 'Sketch Layer (Graphic)'
    })
    const map = new Map({
        basemap: "streets-navigation-vector",
        layers: [sketchGraphicLayer]
    });

    const view = new MapView({
        container: "viewDiv",
        map: map,
        center: [102.83112123370495, 16.45002053546041],
        zoom: 12,
    });

    const classBreakValueAccommodationPricing = [
        {
            minValue: 0,
            maxValue: 599,
            label: 'ที่พักเริ่มต้น',
            image_path: '/images/ที่พัก/type/0star.png'
        },
        {
            minValue: 600,
            maxValue: 1499,
            label: 'ที่พักระดับ 3 ดาว',
            image_path: '/images/ที่พัก/type/3star_1.png'
        },
        {
            minValue: 1500,
            maxValue: 2499,
            label: 'ที่พักระดับ 4 ดาว',
            image_path: '/images/ที่พัก/type/4star_1.png'
        },
        {
            minValue: 2500,
            maxValue: Infinity,
            label: 'ที่พักระดับ 5 ดาว',
            image_path: '/images/ที่พัก/type/5star_1.png'
        },
    ]
    const accommodationMarkRenderer = {
        type: "class-breaks",
        field: "starting_price",
        classBreakInfos: classBreakValueAccommodationPricing.map(data => {
            return {
                minValue: data.minValue,
                maxValue: data.maxValue,
                symbol: new PictureMarkerSymbol({
                    url: data.image_path,
                    width: "26px",
                    height: "26px"
                }),
                label: data.label,
                labelPlacement: "center"
            }
        }),
    }

    const accommodationHeatmapRenderer = {
        type: "heatmap",
        colorStops: [{
            ratio: 0,
            color: "rgba(255, 255, 255, 0)"
        },
        {
            ratio: 0.2,
            color: "#B5A8D5"
        },
        {
            ratio: 0.5,
            color: "#7A73D1"
        },
        {
            ratio: 0.8,
            color: "#4D55CC"
        },
        {
            ratio: 1,
            color: "#211C84"
        }
        ],
        minDensity: 0,
        maxDensity: 0.01,
        radius: 10,
    };

    const accommodationFeatureLayer = new FeatureLayer({
        url: accommodationFeatureUrl,
        title: 'ที่พัก (FeatureLayer)',
        outFields: ["*"],
        renderer: accommodationMarkRenderer,
        minScale: 0,  // ให้แสดงผลตลอดเวลา
        maxScale: 0
    });

    accommodationFeatureLayer.when(() => {
        accommodationFeatureLayer.popupTemplate = {
            title: "🏢 {name}",
            content: async function (event) {
                try {
                    const attributes = event.graphic.attributes;
                    const objectId = attributes.ObjectId;

                    let fullImagePath = ``;
                    console.log(objectId)

                    try {
                        // ดึง attachments
                        const result = await accommodationFeatureLayer.queryAttachments({
                            objectIds: [objectId]
                        });

                        const attachmentInfos = result[objectId];
                        if (attachmentInfos && attachmentInfos.length > 0) {
                            fullImagePath = `${accommodationFeatureLayer.url}/0/${objectId}/attachments/${attachmentInfos[0].id}?token=${loginToken}`;
                            console.log(fullImagePath)
                        } else {
                            fullImagePath = `${location.origin}${attributes.image_path}`;
                        }
                    } catch (error) {
                        console.error("Error retrieving attachments:", error);
                        fullImagePath = `${location.origin}${attributes.image_path}`;
                    }

                    return `
                    <p class="!m-0"><strong>ชื่อ:</strong> ${attributes.name}</p>
                    <p class="!m-0"><strong>ประเภท:</strong> ${attributes.type}</p>
                    <p class="!m-0"><strong>💵 ราคาเริ่มต้น:</strong> ${attributes.starting_price} บาท</p>
                    <p class="!m-0"><strong>⭐ คะแนน:</strong> ${attributes.rating} / 5</p>
                    <img src="${fullImagePath}" alt="${attributes.name}" width="100%">
                    `;
                } catch (error) {
                    console.error("Error:", error);
                    return "Error";
                }
            }
        };
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const travelPlacePopupTemplate = {
        title: "{place_name}",
        content: function (feature) {
            let attributes = feature.graphic.attributes;
            let fullImagePath = `${location.origin}${attributes.image_path}`
            return `
            <div class="flex flex-col">
                <p class="!m-0"><strong>ชื่อสถานที่:</strong> ${attributes.place_name} บาท</p>
                <p class="!m-0"><strong>ประเภท:</strong> ${attributes.type}</p>
                <p class="!m-0"><strong>🕛 เวลาทำการ:</strong> ${attributes.opening_hour} </p>
                <p class="!m-0"><strong>⭐ คะแนน:</strong> ${attributes.rating}/5</p>
                <img src="${fullImagePath}" alt="${attributes.name}" width="100%">
            </div>
            `;
        }
    }

    const travelPlaceMarkRenderer = new UniqueValueRenderer({
        field: "type",
        defaultSymbol: new PictureMarkerSymbol({
            url: '/images/ประเภทสถานที่ท่องเที่ยว/อื่นๆ_2.png',
            width: "32px",
            height: "32px",
            angle: 0
        }),
        defaultLabel: 'อื่นๆ',
        uniqueValueInfos: travelPlaceType.map(row => {
            const obj = {
                value: row.type,
                symbol: new PictureMarkerSymbol({
                    url: row.image_path,
                    width: "32px",
                    height: "32px",
                    angle: 0
                }),
                label: row.type
            }
            return obj
        })
    });



    const travelPlaceHeatmapRenderer = {
        type: "heatmap",
        colorStops: [
            {
                ratio: 0,
                color: "rgba(189, 189, 189, 0)" // สีเทาโปร่งใส
            },
            {
                ratio: 0.2,
                color: "#FEFAE0" // HEX OK!
            },
            {
                ratio: 0.5,
                color: "#FFCF50"
            },
            {
                ratio: 0.8,
                color: "#A4B465"
            },
            {
                ratio: 1,
                color: "#626F47"
            }
        ],
        minDensity: 0,
        maxDensity: 0.01,
        radius: 10
    };

    const travelPlaceCsvLayer = new CSVLayer({
        url: travelPlaceCsvUrl,
        title: 'สถานที่ท่องเที่ยว จ.ขอนแก่น (CSVLayer)',
        renderer: travelPlaceMarkRenderer,
        popupTemplate: travelPlacePopupTemplate
    })

    view.watch("zoom", function (newZoom) {
        if (newZoom >= 12) {
            accommodationFeatureLayer.renderer = accommodationMarkRenderer;
            travelPlaceCsvLayer.renderer = travelPlaceMarkRenderer;
        } else {
            accommodationFeatureLayer.renderer = accommodationHeatmapRenderer;
            travelPlaceCsvLayer.renderer = travelPlaceHeatmapRenderer;
        }
    });

    view.when(function () {
        const layerList = new LayerList({
            view: view
        });

        const searchWidget = new Search({
            view: view,
            suggestionEnabled: true,
            activeSourceIndex: 1,
            sources: [
                {
                    layer: accommodationFeatureLayer,
                    name: "ค้นหาที่พัก จ.ขอนแก่น",
                    searchFields: ["name", "address"],
                    displayField: "name",
                    exactMatch: false,
                    outFields: ["*"],
                    placeholder: "🔍 ค้นหาที่พัก จ.ขอนแก่น",
                    suggestionTemplate: "{name} - {address}",
                },
                {
                    layer: travelPlaceCsvLayer,
                    name: "ค้นหาสถานที่ท่องเที่ยว จ.ขอนแก่น",
                    searchFields: ["place_name", "type"],
                    displayField: "place_name",
                    exactMatch: false,
                    outFields: ["*"],
                    placeholder: "🔍 ค้นหาสถานที่ท่องเที่ยว จ.ขอนแก่น",
                    suggestionTemplate: "{place_name} - {type}",
                }
            ]
        });
        const editor = new Editor({
            view: view,
        });

        // สร้าง Sketch Widget
        const sketchWidget = new Sketch({
            view: view,
            layer: sketchGraphicLayer,
            creationMode: "update" // ให้สามารถแก้ไขได้
        });

        // left
        view.ui.remove("zoom")
        view.ui.add(layerList, "top-left");
        view.ui.add(editor, "top-left");
        view.ui.add(sketchWidget, "bottom-left");
        // right
        view.ui.add(searchWidget, "top-right");
        view.ui.add(new Home({ view: view }), "bottom-right");
        view.ui.add(new Expand({ view: view, content: new BasemapGallery({ view: view }) }), "bottom-right");
        view.ui.add(new Expand({ view: view, content: new Legend({ view: view }) }), "bottom-right");

        // ⭐ ดัก event เมื่อวาด Polygon เสร็จ
        sketchWidget.on("create", function (event) {
            if (event.state === "complete") {
                sketchGraphicLayer.removeAll()
                const polygonGraphic = event.graphic;
                if (polygonGraphic) {
                    sketchGraphicLayer.add(polygonGraphic)
                    applyFilterEffect(polygonGraphic.geometry);
                }
            }
        });

        // ⭐ ดัก event เมื่อมีการอัปเดต Polygon
        sketchWidget.on("update", function (event) {
            if (event.state === "complete") {
                const updatedPolygonGraphic = event.graphics[0];
                applyFilterEffect(updatedPolygonGraphic.geometry);
            }
        });

        // ⭐ ดัก event เมื่อมีการลบ Polygon
        sketchWidget.on("delete", function (event) {
            const deletedPolygonGraphic = event.graphics[0];
            applyFilterEffect(null); // ลบ filter effect ถ้าไม่มี polygon
        });

        function applyFilterEffect(polygonGeometry) {
            if (polygonGeometry) {
                // 🟢 ใช้ geometryFilter กับ FeatureLayer และ CSVLayer
                accommodationFeatureLayer.featureEffect = {
                    filter: { geometry: polygonGeometry },
                    includedEffect: "drop-shadow(3px, 3px, 3px, gray) brightness(1.2)",
                    excludedEffect: "opacity(30%)"
                };

                travelPlaceCsvLayer.featureEffect = {
                    filter: { geometry: polygonGeometry },
                    includedEffect: "drop-shadow(3px, 3px, 3px, gray) brightness(1.2)",
                    excludedEffect: "opacity(30%)"
                };
            } else {
                // ถ้าไม่มี polygon (กรณีลบ) ให้ลบ effect
                accommodationFeatureLayer.featureEffect = null;
                travelPlaceCsvLayer.featureEffect = null;
            }
        }
    }).catch(function (error) {
        console.error("Error initializing view: ", error);
    });

    map.layers.add(accommodationFeatureLayer)
    map.layers.add(travelPlaceCsvLayer)
})

// accommodationFeatureLayer.when(() => {
//     const fields = accommodationFeatureLayer.fields.map(field => field.toJSON());
//     console.log(fields);
// })

// accommodationFeatureLayer.queryFeatures({
//     where: "1=1",  // ดึงทุกแถว
//     outFields: ["*"],  // เอาทุกฟิลด์
//     returnGeometry: false // ไม่ต้องเอาข้อมูลตำแหน่งมา
// }).then((result) => {
//     console.log("Features:", JSON.stringify(result.features, null, 2));
// });