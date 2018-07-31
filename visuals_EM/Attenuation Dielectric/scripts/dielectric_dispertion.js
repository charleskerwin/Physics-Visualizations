$(window).on('load', function() {
        const dom = {//assigning switches and slider
            pswitch: $("#polarisation-switch input"),
            wSlider:$("input#angular_frequency")
        }

    let plt = {//layout of graph
        layout : {
            showlegend: false,
            showscale: false,
            margin: {
                l: 10, r: 10, b: 10, t: 1, pad: 5
            },
            dragmode: 'orbit',
            scene: {
                aspectmode: "cube",
                xaxis: {range: [-1, 1]},
                yaxis: {range: [-1, 1]},
                zaxis: {range: [-1, 2]},

                camera: {
                    up: {x:1, y: 0, z: 0},//sets which way is up
                    eye: {x: 0.1, y: 2, z: 0}//adjust camera starting view
                }
            },
        },
        layout_real:{
                autosize: true,
                xaxis: {
                    range: [0, 2],
                    title: "Angular frequency ratio"
                },
                yaxis: {
                   range: [-2, 4],
                    title:"Real n"
                },
                margin: {
                   l: 50, r: 10, b: 50, t: 50, pad: 5
               },
               legend: {
                   x: 0, y: 10,
                   orientation: "h"
               },
               font: {
                   family: "Fira Sans",
                   size: 16
               }
        },
        layout_img:{
                autosize: true,
                xaxis: {
                    range: [0, 2],
                    title: "Angular frequency ratio"
                },
                yaxis: {
                   range: [0, 3],
                    title: "Imaginary n"
                },
                margin: {
                   l: 50, r: 10, b: 50, t: 50, pad: 5
               },
               legend: {
                   x: 0, y: 10,
                   orientation: "h"
               },
               font: {
                   family: "Fira Sans",
                   size: 16
               }
        }
    };

let w_conversion = 7e5; // Factor to make plot wavelength reasonable
let w_0 = 1e10;

let polarisation_value = $("input[name = polarisation-switch]:checked").val();
let angular_frequency_ratio   = parseFloat($("input#angular_frequency").val())* w_0;

let n1 = 1;
let amplitude = 0.8;//parseFloat($("input#amplitude").val());
let c = 3e8; // Speed of light

function zero_array(size){
    let zero =[];
    for (let i = 0;i<size;i++){
        zero.push(0);
    }
    return zero
}
let size = 10000;//give number of points
let zero = zero_array(size);


class Wave{
    constructor(E_0, polarisation, w) {
            this.E_0 = E_0;
            this.true_w = w;
            //this.w = this.true_w / w_conversion;
            this.k = (this.true_w) / c;
            this.B_0 = E_0;
            this.polarisation = polarisation;
            this.sinusoids = this.create_sinusoids_incident();
        }
    element_cos(matrix,size){
        for (let i = 0; i < size ;i++){
            matrix[i] = math.cos(matrix[i]);
        }
    return matrix
    }

    element_exponential(matrix,size){
        for (let i = 0;i < size;i++){
            matrix[i] = math.exp(matrix[i]);
        }
    return matrix
    }

    create_sinusoids_incident()//fix the math  np stuff
    {
        let z_range = numeric.linspace(-1, 0, size);

        let k_z_cos = this.element_cos(math.multiply(this.k,z_range),size);
        let E_cos,B_cos;

        if (this.polarisation === "s-polarisation") {
            E_cos = [zero, math.multiply(this.E_0, k_z_cos), z_range];
            B_cos = [math.multiply(this.B_0,k_z_cos), zero, z_range];
            }
        else{
            E_cos = [math.multiply(this.E_0, k_z_cos), zero, z_range];
            B_cos = [zero, math.multiply(this.B_0, k_z_cos), z_range];
            }

        let E_trace = [];

        E_trace.push(
            {//add trace for line of field line
            type: "scatter3d",
            mode: "lines",
            name: "e field incident",
            //line: {color: "#02893B"},
            x: E_cos[0],
            y: E_cos[1],
            z: E_cos[2],
            opacity: 1,
            line: {
                width: 4,
                color: "#02893B",
                reversescale: false}
            }
        );

        let B_trace = [];
        B_trace.push(
            {//add trace for line of field line
            type: "scatter3d",
            mode: "lines",
            name: "b field incident",
            //line: {color: "#A51900"},
            x: B_cos[0],
            y: B_cos[1],
            z: B_cos[2],
            opacity: 1,
            line: {
                width: 4,
                color: "#A51900",
                reversescale: false}
            }
        );
        return [E_trace, B_trace]
    };


    attenuation(w_input){//ωd = 0.5ω0 and γ = 0.2ω0

    //console.log("hey");
    let w = w_input;
    //console.log(w);
    let gamma = 0.1*w_0;
    let wd = 0.5*w_0;
    let w_d_squared = wd**2;// (N*(q**2))/(2*e0*m);

    let z_range = numeric.linspace(0, 1, size);

    let n_real = 1 - (w_d_squared*(Math.pow(w,2)-Math.pow(w_0,2))/(Math.pow((Math.pow(w,2)-Math.pow(w_0,2)),2) + Math.pow(w,2)*Math.pow(gamma,2)));

    let n_im = (w_d_squared*w*gamma)/(Math.pow((Math.pow(w,2) - Math.pow(w_0,2)),2)+Math.pow(w,2)*Math.pow(gamma,2));

    let k_real = (w*n_real)/c;

    let k_im = (w*n_im)/(c*5e6);
    console.log(k_real);
    console.log(k_im);

    let exp_E = this.element_exponential(math.multiply(-k_im,z_range),size);

    let k_z_cos = this.element_cos(math.multiply(k_real,z_range),size);
    //console.log(k_z_cos);

    let decayed_cos = math.dotMultiply(exp_E,k_z_cos);
    //console.log(decayed_cos);

    let E_end_amp = this.E_0*exp_E.slice(-1);
    let B_end_amp = this.B_0*exp_E.slice(-1);

    let shift = k_real*1;


    let E_cos_atten,B_cos_atten;

    if (this.polarisation === "s-polarisation") {
        E_cos_atten = [zero, math.multiply(this.E_0, decayed_cos), z_range];
        B_cos_atten = [math.multiply(this.B_0,decayed_cos), zero, z_range];
        }
    else{
        E_cos_atten = [math.multiply(this.E_0, decayed_cos), zero, z_range];
        B_cos_atten = [zero, math.multiply(this.B_0, decayed_cos), z_range];
        }

    let E_trace_atten = [];

    E_trace_atten.push(
        {//add trace for line of field line
        type: "scatter3d",
        mode: "lines",
        name: "e field attenuated",
        //line: {color: "#02893B"},
        x: E_cos_atten[0],
        y: E_cos_atten[1],
        z: E_cos_atten[2],
        opacity: 1,
        line: {
            width: 4,
            color: "#02893B",
            reversescale: false}
        }
    );

    let B_trace_atten = [];

    B_trace_atten.push(
        {//add trace for line of field line
        type: "scatter3d",
        mode: "lines",
        name: "b field attenuated",
        //line: {color: "#A51900"},
        x: B_cos_atten[0],
        y: B_cos_atten[1],
        z: B_cos_atten[2],
        opacity: 1,
        line: {
            width: 4,
            color: "#A51900",
            reversescale: false}
        }
    );
    return [E_trace_atten,B_trace_atten,E_end_amp,B_end_amp,shift,n_im]
    };


    create_sinusoids_transmitted(E_end_amp,B_end_amp,shift)//fix the math  np stuff
    {
        let z_range = numeric.linspace(1, 2, size);
        let z_range_shift = math.add(-1,z_range);
        let o_cos = math.multiply(this.k,z_range_shift);
        let c_input = math.add(shift,o_cos);

        let k_z_cos = this.element_cos(c_input,size);

        let E_cos,B_cos;

        if (this.polarisation === "s-polarisation") {
            E_cos = [zero, math.multiply(E_end_amp, k_z_cos), z_range];
            B_cos = [math.multiply(B_end_amp,k_z_cos), zero, z_range];
            }
        else{
            E_cos = [math.multiply(E_end_amp, k_z_cos), zero, z_range];
            B_cos = [zero, math.multiply(B_end_amp, k_z_cos), z_range];
            }

        let E_trace = [];

        E_trace.push(
            {//add trace for line of field line
            type: "scatter3d",
            mode: "lines",
            name: "e field transmitted",
            //line: {color: "#02893B"},
            x: E_cos[0],
            y: E_cos[1],
            z: E_cos[2],
            opacity: 1,
            line: {
                width: 4,
                color: "#02893B",
                reversescale: false}
            }
        );

        let B_trace = [];
        B_trace.push(
            {//add trace for line of field line
            type: "scatter3d",
            mode: "lines",
            name: "b field transmitted",
            //line: {color: "#A51900"},
            x: B_cos[0],
            y: B_cos[1],
            z: B_cos[2],
            opacity: 1,
            line: {
                width: 4,
                color: "#A51900",
                reversescale: false}
            }
        );
        return [E_trace, B_trace]
    };
};

function computeData() {

    $("#angular_frequency-display").html($("input#angular_frequency").val().toString());

    angular_frequency_ratio = parseFloat($("input#angular_frequency").val())*(w_0);
    polarisation_value = $("input[name = polarisation-switch]:checked").val();

    let Incident = new Wave(amplitude,polarisation_value,angular_frequency_ratio,n1);//(E_0, polarisation, w , n1)

    let dielectric_bit = Incident.attenuation(angular_frequency_ratio);//w,w_0
    let Transmitted = Incident.create_sinusoids_transmitted(dielectric_bit[2],dielectric_bit[3],dielectric_bit[4]);
    let refectrive_index = dielectric_bit[5]/4;

    let material_1 = [];
    material_1.push(
        {//material_1
            opacity: refectrive_index,
            color: '#379F9F',
            type: "mesh3d",
            name: "material_1",
            x: [-1, -1, 1, 1, -1, -1, 1, 1],
            y: [-1, 1, 1, -1, -1, 1, 1, -1],
            z: [ 1, 1, 1, 1, 0, 0, 0, 0],
            i: [7, 0, 0, 0, 4, 4, 6, 6, 4, 0, 3, 2],
            j: [3, 4, 1, 2, 5, 6, 5, 2, 0, 1, 6, 3],
            k: [0, 7, 2, 3, 6, 7, 1, 1, 5, 5, 7, 6],
        }
        );
    let data = Incident.sinusoids[0].concat(Incident.sinusoids[1], dielectric_bit[0],dielectric_bit[1],Transmitted[0],Transmitted[1],material_1);
    //console.log(data);
return data
};

function compute_data_rn() {

    let x = numeric.linspace(0, 2, size);

    let y = [];
    let w;
    let gamma = 0.1*w_0;
    let wd = 0.5*w_0;
    let w_d_squared = wd**2;// (N*(q**2))/(2*e0*m);

    for( let i = 0; i < size; i++){
        w = (x[i])*w_0;
        y.push(1 - (w_d_squared*(Math.pow(w,2)-Math.pow(w_0,2))/(Math.pow((Math.pow(w,2)-Math.pow(w_0,2)),2) + Math.pow(w,2)*Math.pow(gamma,2))));
    }
    let real_n = (1 - (w_d_squared*(Math.pow(angular_frequency_ratio,2)-Math.pow(w_0,2))/(Math.pow((Math.pow(angular_frequency_ratio,2)-Math.pow(w_0,2)),2) + Math.pow(angular_frequency_ratio,2)*Math.pow(gamma,2))));

    data = [x,y];

    let r_rn = {
          x: data[0],
          y: data[1],
          type: 'scatter',
          name: 'Real n',
    };

    let marker = {
            x: [parseFloat($("input#angular_frequency").val())],
            y: [real_n],
            showlegend: false,
            type: "scatter",
            mode:"markers",
            name: 'Real n',
            marker: {color: "#002147", size: 12}
    };

    return [r_rn,marker]
}

function compute_data_in() {

    let x = numeric.linspace(0, 2, size);
    let y = [];
    let w;
    let gamma = 1*w_0;
    let wd = 10*w_0;
    let w_d_squared = wd**2;// (N*(q**2))/(2*e0*m);

    for(let i = 0; i< size; i++){
        w = x[i]*w_0;
        y.push((w_d_squared*w*gamma)/(Math.pow((Math.pow(w,2) - Math.pow(w_0,2)),2)+Math.pow(w,2)*Math.pow(gamma,2)));
    }

    let img_n = (w_d_squared*angular_frequency_ratio*gamma)/(Math.pow((Math.pow(angular_frequency_ratio,2) - Math.pow(w_0,2)),2)+Math.pow(angular_frequency_ratio,2)*Math.pow(gamma,2))

    data = [x,y];

    let r_in = {
          x: data[0],
          y: data[1],
          type: 'scatter',
          name: 'Imaginary n',
    };

    let marker = {
            x: [parseFloat($("input#angular_frequency").val())],
            y: [img_n],
            showlegend: false,
            type: "scatter",
            mode:"markers",
            name: 'Imaginary n',
            marker: {color: "#002147", size: 12}
    };

    return [r_in,marker]
}

function update_graph_n(){

    Plotly.animate("graph_rn",
        {data: compute_data_rn()},//updated data
        {
            fromcurrent: true,
            transition: {duration: 0,},
            frame: {duration: 0, redraw: false,},
            mode: "afterall"
        }
    );

    Plotly.animate("graph_in",
        {data: compute_data_in()},//updated data
        {
            fromcurrent: true,
            transition: {duration: 0,},
            frame: {duration: 0, redraw: false,},
            mode: "afterall"
        }
    );

}

function update_graph(){
    Plotly.animate("graph",
        {data: computeData()},//updated data
        {
            fromcurrent: true,
            transition: {duration: 0,},
            frame: {duration: 0, redraw: false,},
            mode: "afterall"
        }
    );
};


function initial(){
    Plotly.purge("graph");
    Plotly.newPlot('graph', computeData(),plt.layout);

    Plotly.purge("graph_rn");
    Plotly.newPlot('graph_rn', compute_data_rn(),plt.layout_real);

    Plotly.purge("graph_in");
    Plotly.newPlot('graph_in', compute_data_in(),plt.layout_img);

    $('.container').show();//show container after loading finishes

    $('#spinner').hide();

    dom.pswitch.on("change", update_graph);

    dom.wSlider.on("input",update_graph);
    dom.wSlider.on("input",update_graph_n);
}

initial();//run the initial loading
});