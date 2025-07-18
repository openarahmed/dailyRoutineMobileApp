export const cardColors: { [key: string]: { topLeft: string; topRight: string; bottom: string[] } } = {
  Morning: {
    topLeft: '#88482fff',  // টপ-লেফট কোণার কমলা রঙ
    topRight: '#24223c', // টপ-রাইট কোণার হলুদ রঙ
    bottom: ['#171a26', '#171a26'], // নিচের ডার্ক গ্রেডিয়েন্ট
  },
  Midday: {
    topLeft: '#2f2470ff',  // টপ-লেফট কোণার আকাশী রঙ
    topRight: '#1a1f31', // টপ-রাইট কোণার হালকা পার্পল রঙ
    bottom: ['#171a26', '#171a26'], // নিচের ডার্ক গ্রেডিয়েন্ট
  },
  Evening: {
    topLeft: '#3b0642ff',  // টপ-লেফট কোণার পার্পল রঙ
    topRight: '#74415cff', // টপ-রাইট কোণার গোলাপী রঙ
    bottom: ['#171a26', '#171a26'], // নিচের ডার্ক গ্রেডিয়েন্ট
  },
  Night: {
    topLeft: '#272465ff',  // টপ-লেফট কোণার নীল রঙ
    topRight: '#5f4e92ff', // টপ-রাইট কোণার ল্যাভেন্ডার রঙ
    bottom: ['#171a26', '#171a26'], // নিচের ডার্ক গ্রেডিয়েন্ট
  },
};