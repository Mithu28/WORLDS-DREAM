const ROLES = [
  { id: "TOP", label: "Top" },
  { id: "JGL", label: "Jungle" },
  { id: "MID", label: "Mid" },
  { id: "ADC", label: "ADC" },
  { id: "SUP", label: "Support" }
];

// Notes estimées (subjectives) : à vérifier et ajuster.
// Chaque joueur : ["Pseudo", note]
const TEAMS = [
  { tag: "T1", color: "#e2012d", players: {
    TOP: ["Zeus", 90], JGL: ["Oner", 91], MID: ["Faker", 94], ADC: ["Gumayusi", 93], SUP: ["Keria", 95] } },
  { tag: "JDG", color: "#c8102e", players: {
    TOP: ["369", 88], JGL: ["Kanavi", 90], MID: ["Yagao", 86], ADC: ["Ruler", 92], SUP: ["MissingNo", 85] } },
  { tag: "BLG", color: "#1f6feb", players: {
    TOP: ["Bin", 91], JGL: ["XUN", 87], MID: ["knight", 93], ADC: ["Elk", 90], SUP: ["ON", 86] } },
  { tag: "WBG", color: "#7a1fa2", players: {
    TOP: ["TheShy", 84], JGL: ["Weiwei", 85], MID: ["Xiaohu", 87], ADC: ["Light", 86], SUP: ["Crisp", 88] } },
  { tag: "LNG", color: "#2a9d8f", players: {
    TOP: ["Zika", 85], JGL: ["Tarzan", 86], MID: ["Scout", 90], ADC: ["GALA", 88], SUP: ["Hang", 82] } },
  { tag: "GEN", color: "#aa8b00", players: {
    TOP: ["Doran", 86], JGL: ["Peanut", 89], MID: ["Chovy", 95], ADC: ["Peyz", 88], SUP: ["Delight", 85] } },
  { tag: "KT", color: "#d62828", players: {
    TOP: ["Kiin", 90], JGL: ["Cuzz", 87], MID: ["BDD", 89], ADC: ["Aiming", 90], SUP: ["Life", 84] } },
  { tag: "G2", color: "#444b57", players: {
    TOP: ["BrokenBlade", 86], JGL: ["Yike", 82], MID: ["Caps", 91], ADC: ["Hans Sama", 87], SUP: ["Mikyx", 88] } },
  { tag: "FNC", color: "#e86a00", players: {
    TOP: ["Wunder", 85], JGL: ["Razork", 84], MID: ["Humanoid", 86], ADC: ["Upset", 85], SUP: ["Hylissang", 83] } },
  { tag: "NRG", color: "#e0457b", players: {
    TOP: ["Dhokla", 70], JGL: ["Contractz", 72], MID: ["Palafox", 74], ADC: ["FBI", 73], SUP: ["IgNar", 70] } },
  { tag: "TL", color: "#0b5cab", players: {
    TOP: ["Impact", 78], JGL: ["UmTi", 80], MID: ["APA", 78], ADC: ["Yeon", 76], SUP: ["CoreJJ", 88] } },
  { tag: "C9", color: "#0aa3e0", players: {
    TOP: ["Fudge", 77], JGL: ["Blaber", 82], MID: ["EMENES", 72], ADC: ["Berserker", 84], SUP: ["Zven", 76] } },
  { tag: "PSG", color: "#b0006b", players: {
    TOP: ["Azhi", 68], JGL: ["Karsa", 76], MID: ["Maple", 75], ADC: ["Unified", 72], SUP: ["Woody", 74] } }
];
