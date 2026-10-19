// =====================================================
// WORLDS-DREAM : données
// Les notes sont ESTIMÉES (subjectives) : à vérifier / ajuster.
// Chaque joueur : ["Pseudo", note]
// IMPORTANT : il faut au moins 14 équipes (16 équipes au total avec les 2 joueurs).
// =====================================================

const ROLES = [
  { id: "TOP", label: "Top" },
  { id: "JGL", label: "Jungle" },
  { id: "MID", label: "Mid" },
  { id: "ADC", label: "ADC" },
  { id: "SUP", label: "Support" }
];

const TEAMS = [
  { tag: "T1", name: "T1", color: "#e2012d", players: {
    TOP: ["Zeus", 90], JGL: ["Oner", 91], MID: ["Faker", 94], ADC: ["Gumayusi", 93], SUP: ["Keria", 95] } },
  { tag: "JDG", name: "JD Gaming", color: "#c8102e", players: {
    TOP: ["369", 88], JGL: ["Kanavi", 90], MID: ["Yagao", 86], ADC: ["Ruler", 92], SUP: ["MissingNo", 85] } },
  { tag: "BLG", name: "Bilibili Gaming", color: "#1f6feb", players: {
    TOP: ["Bin", 91], JGL: ["XUN", 87], MID: ["knight", 93], ADC: ["Elk", 90], SUP: ["ON", 86] } },
  { tag: "WBG", name: "Weibo Gaming", color: "#7a1fa2", players: {
    TOP: ["TheShy", 84], JGL: ["Weiwei", 85], MID: ["Xiaohu", 87], ADC: ["Light", 86], SUP: ["Crisp", 88] } },
  { tag: "LNG", name: "LNG Esports", color: "#2a9d8f", players: {
    TOP: ["Zika", 85], JGL: ["Tarzan", 86], MID: ["Scout", 90], ADC: ["GALA", 88], SUP: ["Hang", 82] } },
  { tag: "GEN", name: "Gen.G", color: "#aa8b00", players: {
    TOP: ["Doran", 86], JGL: ["Peanut", 89], MID: ["Chovy", 95], ADC: ["Peyz", 88], SUP: ["Delight", 85] } },
  { tag: "KT", name: "KT Rolster", color: "#d62828", players: {
    TOP: ["Kiin", 90], JGL: ["Cuzz", 87], MID: ["BDD", 89], ADC: ["Aiming", 90], SUP: ["Life", 84] } },
  { tag: "G2", name: "G2 Esports", color: "#444b57", players: {
    TOP: ["BrokenBlade", 86], JGL: ["Yike", 82], MID: ["Caps", 91], ADC: ["Hans Sama", 87], SUP: ["Mikyx", 88] } },
  { tag: "FNC", name: "Fnatic", color: "#e86a00", players: {
    TOP: ["Wunder", 85], JGL: ["Razork", 84], MID: ["Humanoid", 86], ADC: ["Upset", 85], SUP: ["Hylissang", 83] } },
  { tag: "NRG", name: "NRG", color: "#e0457b", players: {
    TOP: ["Dhokla", 70], JGL: ["Contractz", 72], MID: ["Palafox", 74], ADC: ["FBI", 73], SUP: ["IgNar", 70] } },
  { tag: "TL", name: "Team Liquid", color: "#0b5cab", players: {
    TOP: ["Impact", 78], JGL: ["UmTi", 80], MID: ["APA", 78], ADC: ["Yeon", 76], SUP: ["CoreJJ", 88] } },
  { tag: "C9", name: "Cloud9", color: "#0aa3e0", players: {
    TOP: ["Fudge", 77], JGL: ["Blaber", 82], MID: ["EMENES", 72], ADC: ["Berserker", 84], SUP: ["Zven", 76] } },
  { tag: "PSG", name: "PSG Talon", color: "#b0006b", players: {
    TOP: ["Azhi", 68], JGL: ["Karsa", 76], MID: ["Maple", 75], ADC: ["Unified", 72], SUP: ["Woody", 74] } },
  { tag: "LOUD", name: "LOUD", color: "#16a34a", players: {
    TOP: ["Robo", 74], JGL: ["Croc", 76], MID: ["tinowns", 78], ADC: ["Route", 79], SUP: ["RedBert", 74] } }
];
