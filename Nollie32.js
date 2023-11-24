export function Name() { return "Nollie32"; } 
export function VendorId() { return 0x3061; }
export function ProductId() { return 0x4714; }
export function Publisher() { return "Nollie"; } 
export function Size() { return [0, 0]; }
export function DefaultPosition(){return [120, 80];}
export function DefaultScale(){return 8.0;}
export function Type() { return "Hid"; }

export function ControllableParameters() 
{
	return [
		{"property":"shutdownColor", "label":"Shutdown Color", "min":"0", "max":"360", "type":"color", "default":"000000"},
		{"property":"LightingMode", "label":"Lighting Mode", "type":"combobox", "values":["Canvas", "Forced"], "default":"Canvas"},
		{"property":"forcedColor", "label":"Forced Color", "min":"0", "max":"360", "type":"color", "default":"009bde"},
		{"property":"ATXCable", "group":"lighting", "label":"24 Pin Cable Connected", "type":"boolean", "default": "true"},
		{"property":"GPUCable", "group":"lighting", "label":"GPU Cable Connected", "type":"boolean", "default": "true"},
		{"property":"GPUCableType", "group":"lighting", "label":"GPU Cable Type", "type":"combobox", "values":["Dual 8 Pin", "Triple 8 Pin"], "default":"Triple 8 Pin"},
		{"property":"CLE", "group":"lighting", "label":"Cable effect", "type":"combobox", "values":["Canvas", "Meteor"], "default":"Canvas"},
		{"property":"version", "group":"lighting", "label":"Protocol version", "type":"combobox", "values":["V1", "V2"], "default":"V1"},
		{"property":"HLE", "group":"lighting", "label":"Hardware effect", "type":"combobox", "values":["Static", "Nollie"], "default":"Static"}];
}

const ChannelLed = 256;
const MaxLedsInPacket = 256;
const DeviceMaxLedLimit = ChannelLed * 20;
let channelReload = false;
let SendData = [];
let ChLedNum = new Array(32).fill(0);
let framesMB = 0;
let framesGPU = 0;
let CableDataMB = [];
let CableDataGPU = [];
const vDual8PinLedNames =
[
	"LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10",
	"LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20",
	"LED 21", "LED 22", "LED 23", "LED 24", "LED 25", "LED 26", "LED 27", "LED 28", "LED 29", "LED 30",

	"LED 31", "LED 32", "LED 33", "LED 34", "LED 35", "LED 36", "LED 37", "LED 38", "LED 39", "LED 40",
	"LED 41", "LED 42", "LED 43", "LED 44", "LED 45", "LED 46", "LED 47", "LED 48", "LED 49", "LED 50",
	"LED 51", "LED 52", "LED 53", "LED 54", "LED 55", "LED 56", "LED 57", "LED 58", "LED 59", "LED 60",

	"LED 61", "LED 62", "LED 63", "LED 64", "LED 65", "LED 66", "LED 67", "LED 68", "LED 69", "LED 70",
	"LED 71", "LED 72", "LED 73", "LED 74", "LED 75", "LED 76", "LED 77", "LED 78", "LED 79", "LED 80",
	"LED 81", "LED 82", "LED 83", "LED 84", "LED 85", "LED 86", "LED 87", "LED 88", "LED 89", "LED 90",

	"LED 91", "LED 92", "LED 93", "LED 94", "LED 95", "LED 96", "LED 97", "LED 98", "LED 99", "LED 100",
	"LED 101", "LED 102", "LED 103", "LED 104", "LED 105", "LED 106", "LED 107", "LED 108"
];

const vDual8PinLedPositions =
[
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0],
	[10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0],
	[20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0],

	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],
	[10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1],
	[20, 1], [21, 1], [22, 1], [23, 1], [24, 1], [25, 1], [26, 1],

	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],
	[10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [18, 2], [19, 2],
	[20, 2], [21, 2], [22, 2], [23, 2], [24, 2], [25, 2], [26, 2],

	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],
	[10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3],
	[20, 3], [21, 3], [22, 3], [23, 3], [24, 3], [25, 3], [26, 3]
];

const vTriple8PinLedNames = //162
[
	"LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10",
	"LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20",
	"LED 21", "LED 22", "LED 23", "LED 24", "LED 25", "LED 26", "LED 27",

	"LED 28", "LED 29", "LED 30", "LED 31", "LED 32", "LED 33", "LED 34", "LED 35", "LED 36", "LED 37", "LED 38", "LED 39", "LED 40",
	"LED 41", "LED 42", "LED 43", "LED 44", "LED 45", "LED 46", "LED 47", "LED 48", "LED 49", "LED 50",
	"LED 51", "LED 52", "LED 53", "LED 54",

	"LED 55", "LED 56", "LED 57", "LED 58", "LED 59", "LED 60", "LED 61", "LED 62", "LED 63", "LED 64", "LED 65", "LED 66", "LED 67", "LED 68", "LED 69", "LED 70",
	"LED 71", "LED 72", "LED 73", "LED 74", "LED 75", "LED 76", "LED 77", "LED 78", "LED 79", "LED 80",
	"LED 81",

	"LED 82", "LED 83", "LED 84", "LED 85", "LED 86", "LED 87", "LED 88", "LED 89", "LED 90", "LED 91", "LED 92", "LED 93", "LED 94",
	"LED 95", "LED 96", "LED 97", "LED 98", "LED 99", "LED 100", "LED 101", "LED 102", "LED 103", "LED 104", "LED 105", "LED 106", "LED 107", "LED 108",

	"LED 109", "LED 110", "LED 111", "LED 112", "LED 113", "LED 114", "LED 115", "LED 116", "LED 117", "LED 118", "LED 119", "LED 120", "LED 121", "LED 122",
	"LED 123", "LED 124", "LED 125", "LED 126", "LED 127", "LED 128", "LED 129", "LED 130", "LED 131", "LED 132", "LED 133", "LED 134", "LED 135",

	"LED 136", "LED 137", "LED 138", "LED 139", "LED 140", "LED 141", "LED 142", "LED 143", "LED 144", "LED 145", "LED 146", "LED 147", "LED 148", "LED 149", "LED 150", "LED 151",
	"LED 152", "LED 153", "LED 154", "LED 155", "LED 156", "LED 157", "LED 158", "LED 159", "LED 160", "LED 161", "LED 162"

];

const vTriple8PinLedPositions =
[
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0],
	[10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0],
	[20, 0], [21, 0], [22, 0], [23, 0], [24, 0], [25, 0], [26, 0],

	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],
	[10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1],
	[20, 1], [21, 1], [22, 1], [23, 1], [24, 1], [25, 1], [26, 1],

	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],
	[10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [18, 2], [19, 2],
	[20, 2], [21, 2], [22, 2], [23, 2], [24, 2], [25, 2], [26, 2],

	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],
	[10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3],
	[20, 3], [21, 3], [22, 3], [23, 3], [24, 3], [25, 3], [26, 3],

	[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],
	[10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4], [17, 4], [18, 4], [19, 4],
	[20, 4], [21, 4], [22, 4], [23, 4], [24, 4], [25, 4], [26, 4],

	[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],
	[10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [16, 5], [17, 5], [18, 5], [19, 5],
	[20, 5], [21, 5], [22, 5], [23, 5], [24, 5], [25, 5], [26, 5]
];

const v24PinLedNames =
[
	"LED 1", "LED 2", "LED 3", "LED 4", "LED 5", "LED 6", "LED 7", "LED 8", "LED 9", "LED 10",
	"LED 11", "LED 12", "LED 13", "LED 14", "LED 15", "LED 16", "LED 17", "LED 18", "LED 19", "LED 20",
	"LED 21", "LED 22", "LED 23", "LED 24", "LED 25", "LED 26", "LED 27",

	"LED 28", "LED 29", "LED 30", "LED 31", "LED 32", "LED 33", "LED 34", "LED 35", "LED 36", "LED 37", "LED 38", "LED 39", "LED 40",
	"LED 41", "LED 42", "LED 43", "LED 44", "LED 45", "LED 46", "LED 47", "LED 48", "LED 49", "LED 50",
	"LED 51", "LED 52", "LED 53", "LED 54",

	"LED 55", "LED 56", "LED 57", "LED 58", "LED 59", "LED 60", "LED 61", "LED 62", "LED 63", "LED 64", "LED 65", "LED 66", "LED 67", "LED 68", "LED 69", "LED 70",
	"LED 71", "LED 72", "LED 73", "LED 74", "LED 75", "LED 76", "LED 77", "LED 78", "LED 79", "LED 80",
	"LED 81",

	"LED 82", "LED 83", "LED 84", "LED 85", "LED 86", "LED 87", "LED 88", "LED 89", "LED 90", "LED 91", "LED 92", "LED 93", "LED 94",
	"LED 95", "LED 96", "LED 97", "LED 98", "LED 99", "LED 100", "LED 101", "LED 102", "LED 103", "LED 104", "LED 105", "LED 106", "LED 107", "LED 108",

	"LED 109", "LED 110", "LED 111", "LED 112", "LED 113", "LED 114", "LED 115", "LED 116", "LED 117", "LED 118", "LED 119", "LED 120"

];

const v24PinLedPositions =
[
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0],
	[10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0],

	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1],
	[10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [18, 1], [19, 1],

	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2],
	[10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2], [18, 2], [19, 2],

	[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3],
	[10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [16, 3], [17, 3], [18, 3], [19, 3],

	[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4],
	[10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4], [17, 4], [18, 4], [19, 4],

	[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5],
	[10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [16, 5], [17, 5], [18, 5], [19, 5]
];

let ChannelArray = 
[
	["Channel 01", ChannelLed],
	["Channel 02", ChannelLed],
	["Channel 03", ChannelLed],
	["Channel 04", ChannelLed],
	["Channel 05", ChannelLed],
	["Channel 06", ChannelLed],
	["Channel 07", ChannelLed],
	["Channel 08", ChannelLed],
	["Channel 09", ChannelLed],
	["Channel 10", ChannelLed],
	["Channel 11", ChannelLed],
	["Channel 12", ChannelLed],
	["Channel 13", ChannelLed],
	["Channel 14", ChannelLed],
	["Channel 15", ChannelLed],
	["Channel 16", ChannelLed],
	["EXT 1", ChannelLed],
	["EXT 2", ChannelLed],
	["EXT 3", ChannelLed],
	["EXT 4", ChannelLed]
];

let ChannelIndex = [5,4,3,2,1,0,15,14,26,27,28,29,30,31,8,9,13,12,11,10];
let ATXCableIndex = [19,18,17,16,7,6];
let GPUCableIndex = [25,24,23,22,21,20];
// let ExtIndex = [13,12,11,10];

export function onGPUCableChanged() 
{
	addChannels();
}

export function onATXCableChanged() 
{
	addChannels();
}

export function onGPUCableTypeChanged() 
{
	addChannels();
}


function SetupChannels()
{
	device.SetLedLimit(DeviceMaxLedLimit);

	for(let i = 0; i < ChannelArray.length; i++)
	{
		device.addChannel(ChannelArray[i][0], ChannelArray[i][1]);
	}
}




export function Initialize() 
{
	addCable();
	SetupChannels();
	let ColorData = device.createColorArray(forcedColor, 1, "Inline", "BRG");

	let Data = getEteorColorMB(240,ColorData[0],ColorData[1],ColorData[2]);
	CableDataMB = Data.slice(0, 720);

	let Data1 = getEteorColorGPU(486,ColorData[0],ColorData[1],ColorData[2]);
	CableDataGPU = Data1.slice(0, 972);
	// device.log(CableData.length);
}

export function Render() 
{
	SendData = [];
 
	for(let i = 0; i < ChannelArray.length; i++)
	{ 
		GetChannelColors(i);
		// device.log(i);
	}
	// device.log(SendData);
	if(!channelReload) 
	{
		if(ATXCable) 
		{
			let Meteor_data = [];
			let RGBData = [];
			if(CLE === "Meteor")
			{
				for (let i = 0; i < 3; i++) 
			    {
				    const element = CableDataMB.shift();  // 移除数组的第一个元素
			    }
				Meteor_data = [...CableDataMB.slice(0,360)];	
				adjustArray(Meteor_data,360);
				framesMB += 1;
				if(framesMB>120)
				{
					framesMB = 0;
					let ColorData = device.createColorArray(forcedColor, 1, "Inline", "BRG");
					let Data = getEteorColorMB(120,ColorData[0],ColorData[1],ColorData[2]);
					CableDataMB.push(...Data);
					adjustArray(CableDataMB,720);
				}
				Meteor_data.reverse();
			}
			if(CLE === "Meteor")
			{
				RGBData.push(...Meteor_data.slice(0, 360));
			}
			else
			{
				RGBData = getMoboColors();
			}	
			for(let CurrPacket = 0; CurrPacket < 6; CurrPacket++)
			{
				let { high, low } = splitHex(20);
				let packet = [ATXCableIndex[CurrPacket],0,high,low];
				packet.push(...RGBData.splice(0, 60));
				SendData.push(packet);
			}
		}

		if(GPUCable) 	
		{
			let Meteor_data = [];
			let RGBData = [];
			if(CLE === "Meteor")
			{
				for (let i = 0; i < 3; i++) 
			    {
				    const element = CableDataGPU.shift();  // 移除数组的第一个元素
			    }
				Meteor_data = [...CableDataGPU.slice(0,486)];	
				adjustArray(Meteor_data,486);
				framesGPU += 1;
				if(framesGPU>162)
				{
					framesGPU = 0;
					let ColorData = device.createColorArray(forcedColor, 1, "Inline", "BRG");	
					let Data = getEteorColorGPU(162,ColorData[0],ColorData[1],ColorData[2]);
					CableDataGPU.push(...Data);
					adjustArray(CableDataGPU,972);
				}
				Meteor_data.reverse();
				// device.log(CableData.length);
			}
			if(GPUCableType === "Dual 8 Pin") //108
			{
				let RGBData = [];
				if(CLE === "Meteor")
				{
					RGBData.push(...Meteor_data.slice(0, 324));
				}
				else
				{
					RGBData = getDualGPUColors();
				}	
				// let RGBData = getDualGPUColors();
				for(let CurrPacket = 0; CurrPacket < 4; CurrPacket++)
				{
					let { high, low } = splitHex(27);
					let packet = [GPUCableIndex[CurrPacket],0,high,low];
					packet.push(...RGBData.splice(0, 81));
					SendData.push(packet);
				}
			}				
			else if(GPUCableType === "Triple 8 Pin") //162
			{
				let RGBData = [];
				if(CLE === "Meteor")
				{
					RGBData.push(...Meteor_data.slice(0, 486));
				}
				else
				{
					RGBData = getTripleGPUColors();
				}	
				// let RGBData = getTripleGPUColors();
				for(let CurrPacket = 0; CurrPacket < 6; CurrPacket++)
				{
					let { high, low } = splitHex(27);
					let packet = [GPUCableIndex[CurrPacket],0,high,low];
					packet.push(...RGBData.splice(0, 81));
					SendData.push(packet);
				}
			}

		}
		
	}	
	else 	
	{
		channelReload = false;
	}
	SendData.sort((a, b) => a[0] - b[0]);


	//连续写入	
	if(version === "V2") 
	{
		//获取通道长度
		let ChLedNum_temp = new Array(32).fill(0);
		for (let i = 0; i < SendData.length; i++) 
		{
			ChLedNum_temp[SendData[i][0]] = (SendData[i].length -4)/3;
		}

		for (let i = 0; i < ChLedNum.length; i++)
		{
			if(ChLedNum[i] != ChLedNum_temp[i])
			{
				ChLedNum = Array.from(ChLedNum_temp);
				device.log(ChLedNum_temp);
				let Ch_led_data = [];
				for(let p = 0;  p < ChLedNum.length; p++)
				{
					let { high, low } = splitHex(ChLedNum[p]);
					Ch_led_data[p * 2]    = high;
					Ch_led_data[p * 2 +1] = low;
				}	
				device.write([0,0x88, ...Ch_led_data], 1024);
				break;
			}	
		}	

		let DMA1_Index = [];
		let DMA2_Index = [];

		// 记录索引值
		for (let i = 0; i < SendData.length; i++) 
		{
			// device.log(i);a
			if(SendData[i][0] < 16)
			{
				DMA1_Index.push(i);
			}
			else
			{
				DMA2_Index.push(i);
			}	
		}
		
		if(DMA1_Index.length)
		{
			let Packet_Led_Num = 0;
			let Packet_Index = [];
			for (let i = 0; i < DMA1_Index.length;) 
			{
				let Index = DMA1_Index[i];
				if (Packet_Led_Num + ChLedNum[SendData[Index][0]] * 3 < 1020) 
				{
					Packet_Led_Num += ChLedNum[SendData[Index][0]] * 3;
					Packet_Index.push(Index);
					if(i+1 == DMA1_Index.length)//后面没数据了  发送数据并请求刷新
					{
						let Start = Packet_Index[0];
						let End   = Packet_Index[Packet_Index.length - 1];
						Send_data_V2(Start,End,0x01);
						Packet_Index = [];
						Packet_Led_Num = 0;
					}	
					i=i+1;
				}
				else // 溢出了
				{
					let Markers = 0x00;
					if(i+1 == DMA1_Index.length)//后面没数据了  发送数据并请求刷新
					{
						let Markers = 0x01;
					}
					let Start = Packet_Index[0];
					let End   = Packet_Index[Packet_Index.length - 1];
					Send_data_V2(Start,End,Markers);
					Packet_Index = [];
					Packet_Led_Num = 0;
				}	
			}
		}
		if(DMA2_Index.length)
		{
			let Packet_Led_Num = 0;
			let Packet_Index = [];
			for (let i = 0; i < DMA2_Index.length;) 
			{
				let Index = DMA2_Index[i];
				if (Packet_Led_Num + ChLedNum[SendData[Index][0]] * 3 < 1020) 
				{
					Packet_Led_Num += ChLedNum[SendData[Index][0]] * 3;
					Packet_Index.push(Index);
					if(i+1 == DMA2_Index.length)//后面没数据了  发送数据并请求刷新
					{
						let Start = Packet_Index[0];
						let End   = Packet_Index[Packet_Index.length - 1];
						Send_data_V2(Start,End,0x02);
						Packet_Index = [];
						Packet_Led_Num = 0;
					}	
					i=i+1;
				}
				else // 溢出了
				{
					let Markers = 0x00;
					if(i+1 == DMA2_Index.length)//后面没数据了  发送数据并请求刷新
					{
						let Markers = 0x02;
					}
					let Start = Packet_Index[0];
					let End   = Packet_Index[Packet_Index.length - 1];
					Send_data_V2(Start,End,Markers);
					Packet_Index = [];
					Packet_Led_Num = 0;
				}	
			}
		}
		
	}

	//单通道独立发
	if(version === "V1") 
	{
		let newElement = 0;
		for (let i = 0; i < SendData.length; i++) 
		{
		  	SendData[i] = [newElement, ...SendData[i]];
		  	device.write(SendData[i], 1024);
		}
	}	
	// device.log(SendData);
}

function Send_data_V2(Ch_start,Ch_end,DMACh) 
{
	let packet = [0x00,0x40,SendData[Ch_start][0],SendData[Ch_end][0],DMACh];
	for(let index = Ch_start;index <= Ch_end;index++)
	{
		packet.push(...SendData[index].splice(4, SendData[index].length));		
	}
	device.write(packet,1024);
}

function addCable() 
{
	device.removeSubdevice("Dual8PinStrimer"); 
	device.removeSubdevice("Triple8PinStrimer");
	device.removeSubdevice("24PinStrimer");
	channelReload = true;

	if(ATXCable) 
	{
		device.createSubdevice("24PinStrimer");
		device.setSubdeviceName("24PinStrimer", `ATX Strimer`);
		device.setSubdeviceSize("24PinStrimer", 20, 6);
		device.setSubdeviceLeds("24PinStrimer", v24PinLedNames, v24PinLedPositions);
		//device.setSubdeviceImage("24PinStrimer", Image());
	}
	if(GPUCable) 	
	{

		if(GPUCableType === "Dual 8 Pin") 
		{
			device.createSubdevice("Dual8PinStrimer");
			device.setSubdeviceName("Dual8PinStrimer", `Dual 8 Pin Strimer`);
			device.setSubdeviceSize("Dual8PinStrimer", 27, 4);
			device.setSubdeviceLeds("Dual8PinStrimer", vDual8PinLedNames, vDual8PinLedPositions);
			//device.setSubdeviceImage("Dual8PinStrimer", Image());
		} 
		else if(GPUCableType === "Triple 8 Pin") 
		{
			device.createSubdevice("Triple8PinStrimer");
			device.setSubdeviceName("Triple8PinStrimer", `Triple 8 Pin Strimer`);
			device.setSubdeviceSize("Triple8PinStrimer", 27, 6);
			device.setSubdeviceLeds("Triple8PinStrimer", vTriple8PinLedNames, vTriple8PinLedPositions);
			//device.setSubdeviceImage("Dual8PinStrimer", Image());
		}
	}
	Save_Settings();
}
export function Shutdown() 
{
	Save_Settings();
	let packet = [0x00,0xff];
	device.write(packet, 513);
	device.pause(50);

}

function GetChannelColors(Channel, shutdown = false)
{
	// device.log(Channel);
	let ChannelLedCount = device.channel(ChannelArray[Channel][0]).ledCount > ChannelArray[Channel][1] ? ChannelArray[Channel][1] : device.channel(ChannelArray[Channel][0]).ledCount;
	let componentChannel = device.channel(ChannelArray[Channel][0]);

	let RGBData = [];

	if(shutdown)
	{
		RGBData = device.createColorArray(shutdownColor, ChannelLedCount, "Inline", "GRB");
	}
	else if(LightingMode === "Forced")
	{
		RGBData = device.createColorArray(forcedColor, ChannelLedCount, "Inline", "GRB");
	}
	else if(componentChannel.shouldPulseColors())
	{
		ChannelLedCount = ChannelLed;

		let pulseColor = device.getChannelPulseColor(ChannelArray[Channel][0], ChannelLedCount);
		RGBData = device.createColorArray(pulseColor, ChannelLedCount, "Inline", "GRB");
	}
	else
	{
		RGBData = device.channel(ChannelArray[Channel][0]).getColors("Inline", "GRB");
	}

	var NumPackets = Math.ceil(ChannelLedCount/ MaxLedsInPacket);

	if (RGBData.length != 0 || ChannelIndex[Channel] == 31 || ChannelIndex[Channel] == 15)
	{
		if (ChannelIndex[Channel] == 31 || ChannelIndex[Channel] == 15)
		{
			if(version === "V1") 
			{
				if(NumPackets == 0)
				{
					NumPackets = 1;
				}
			}	
		}
		for(var CurrPacket = 0; CurrPacket < NumPackets; CurrPacket++)
		{
			let { high, low } = splitHex(ChannelLedCount);
			let packet = [ChannelIndex[Channel],CurrPacket,high,low];
			packet.push(...RGBData.splice(0, RGBData.length));
			SendData.push(packet);
		}	
	} 
}

function getMoboColors(shutdown = false) 
{
	let RGBData = [];

	for(let iIdx = 0; iIdx < v24PinLedPositions.length; iIdx++) {
		const iPxX = v24PinLedPositions[iIdx][0];
		const iPxY = v24PinLedPositions[iIdx][1];
		let color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.subdeviceColor("24PinStrimer", iPxX, iPxY);
		}
		const iLedIdx = iIdx * 3;
		RGBData[iLedIdx] = color[1];;
		RGBData[iLedIdx+1] = color[0];
		RGBData[iLedIdx+2] = color[2];
	}
	return RGBData;
}

function getDualGPUColors(shutdown = false) 
{
	const RGBData = [];

	for(let iIdx = 0; iIdx < vDual8PinLedPositions.length; iIdx++) {
		const iPxX = vDual8PinLedPositions[iIdx][0];
		const iPxY = vDual8PinLedPositions[iIdx][1];
		let color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.subdeviceColor("Dual8PinStrimer", iPxX, iPxY);
		}

		const iLedIdx = iIdx * 3;
		RGBData[iLedIdx] = color[1];;
		RGBData[iLedIdx+1] = color[0];
		RGBData[iLedIdx+2] = color[2];
	}
	return RGBData;
}

function getTripleGPUColors(shutdown = false) 
{
	const RGBData = [];

	for(let iIdx = 0; iIdx < vTriple8PinLedPositions.length; iIdx++) {
		const iPxX = vTriple8PinLedPositions[iIdx][0];
		const iPxY = vTriple8PinLedPositions[iIdx][1];
		let color;

		if(shutdown) {
			color = hexToRgb(shutdownColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			color = device.subdeviceColor("Triple8PinStrimer", iPxX, iPxY);
		}

		const iLedIdx = iIdx * 3;
		RGBData[iLedIdx] = color[1];;
		RGBData[iLedIdx+1] = color[0];
		RGBData[iLedIdx+2] = color[2];
	}
	return RGBData;
}

function Save_Settings() 
{
	let Mos = 0;
	let RGBData = [];
	let packet1 = [];
	RGBData = device.createColorArray(shutdownColor, 1, "Inline");	
	if(GPUCableType === "Dual 8 Pin") 
	{
		Mos = 1;
	}
	if(HLE === "Static")
	{
		packet1 = [0x00,0x80,Mos,0x03,RGBData[0],RGBData[1],RGBData[2]];
	}	
	if(HLE === "Nollie")
	{
		packet1 = [0x00,0x80,Mos,0x01,RGBData[0],RGBData[1],RGBData[2]];
	}	
	device.write(packet1, 513);
	device.pause(50);
}

function getEteorColorMB(led_num,R,G,B)
{
	const RGBData = [];
	for (let i = 0; i < led_num * 3;) 
	{
	  const meteorIndex = 5;
	  const  interval   = getRandomInt(21, 26); 
	  i += (meteorIndex + interval) * 3 ;
	  for (let index = 0; index < meteorIndex; index++) 
	  {
	  	if(index == 0 )
	  	{
	  		RGBData.push(...[Math.floor(R / 10),Math.floor(G / 10),Math.floor(B / 10)]);
	  	}
	  	else if(index == 4)
	  	{
	  		RGBData.push(...[Math.floor(R / 10),Math.floor(G / 10),Math.floor(B / 10)]);
	  	}		
	  	else
	  	{
	  		RGBData.push(...[R,G,B]);
	  	}	
	  }  
	  for (let index = 0; index < interval; index++) 
	  {
	    RGBData.push(...[0,0,0]);
	  } 
	}
	return RGBData;
}

function getEteorColorGPU(led_num,R,G,B)
{
	const RGBData = [];
	for (let i = 0; i < led_num * 3;) 
	{
	  const meteorIndex = 5;
	  const  interval   = getRandomInt(28, 33); 
	  i += (meteorIndex + interval) * 3 ;
	  for (let index = 0; index < meteorIndex; index++) 
	  {
	  	if(index == 0 )
	  	{
	  		RGBData.push(...[Math.floor(R / 10),Math.floor(G / 10),Math.floor(B / 10)]);
	  	}
	  	else if(index == 4)
	  	{
	  		RGBData.push(...[Math.floor(R / 10),Math.floor(G / 10),Math.floor(B / 10)]);
	  	}		
	  	else
	  	{
	  		RGBData.push(...[R,G,B]);
	  	}	
	  }  
	  for (let index = 0; index < interval; index++) 
	  {
	    RGBData.push(...[0,0,0]);
	  } 
	}
	return RGBData;
}

function hexToRgb(hex) 
{
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	const colors = [];
	colors[0] = parseInt(result[1], 16);
	colors[1] = parseInt(result[2], 16);
	colors[2] = parseInt(result[3], 16);

	return colors;
}

function splitHex(num) 
{
  const high = (num >>> 8) & 0xFF; // 取高 8 位，并且将低 24 位清零
  const low = num & 0xFF; // 取低 8 位
  // const chk = high ^ low ^ 0x55; // 计算校验值
  return { high, low }; // 返回高位、低位和校验值的整数
}

function getRandomInt(min, max) 
{
  // 使用 Math.floor() 将小数部分截断，确保得到整数
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rotateArray(arr, positions) 
{
  const n = arr.length;
  positions = positions % n;  // 处理超出数组长度的情况

  for (let i = 0; i < positions; i++) 
  {
    const element = arr.shift();  // 移除数组的第一个元素
    arr.push(element);            // 将移除的元素添加到数组末尾
  }
  return arr;
}

function adjustArray(arr, desiredLength) 
{
  // 如果数组长度不够，用0填充
  while (arr.length < desiredLength) 
  {
    arr.push(0);
  }

  // 如果数组长度超过，去掉多余的元素
  while (arr.length > desiredLength) 
  {
    arr.pop();
  }

  return arr;
}

export function Validate(endpoint)
{
	return endpoint.interface === 0 ;
}

export function ImageUrl()
{
	return "https://gitee.com/cnn123666/nollie-controller/raw/master/Image/Nollie32.png";
}
