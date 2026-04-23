// Community mock data — groups, posts, comments, tutor profiles

export const communityGroups = [
  // Por Raça
  { id: 'g1', name: 'Golden Retriever', emoji: '🦮', category: 'breed', members: 2847 },
  { id: 'g2', name: 'Siamês', emoji: '🐱', category: 'breed', members: 1523 },
  { id: 'g3', name: 'Bulldog', emoji: '🐶', category: 'breed', members: 1891 },
  { id: 'g4', name: 'Poodle', emoji: '🐩', category: 'breed', members: 2105 },
  { id: 'g5', name: 'Labrador', emoji: '🐕', category: 'breed', members: 3214 },
  { id: 'g6', name: 'SRD', emoji: '🐾', category: 'breed', members: 5632 },
  // Por Cidade
  { id: 'g7', name: 'São Paulo', emoji: '🏙️', category: 'city', members: 8742 },
  { id: 'g8', name: 'Rio de Janeiro', emoji: '🏖️', category: 'city', members: 6201 },
  { id: 'g9', name: 'Belo Horizonte', emoji: '⛰️', category: 'city', members: 3105 },
  { id: 'g10', name: 'Curitiba', emoji: '🌲', category: 'city', members: 2890 },
  { id: 'g11', name: 'Brasília', emoji: '🏛️', category: 'city', members: 2456 },
  // Por Tema
  { id: 'g12', name: 'Saúde', emoji: '💊', category: 'topic', members: 12450 },
  { id: 'g13', name: 'Alimentação', emoji: '🍖', category: 'topic', members: 9870 },
  { id: 'g14', name: 'Adestramento', emoji: '🎓', category: 'topic', members: 7650 },
  { id: 'g15', name: 'Passeios', emoji: '🌳', category: 'topic', members: 6340 },
  { id: 'g16', name: 'Filhotes', emoji: '🐣', category: 'topic', members: 8920 },
];

export const mockTutorProfiles = [
  { id: 't1', name: 'Ana Oliveira', petName: 'Thor', petBreed: 'Golden Retriever', avatar: '👩‍🦰' },
  { id: 't2', name: 'Pedro Santos', petName: 'Bob', petBreed: 'Labrador', avatar: '👨' },
  { id: 't3', name: 'Juliana Lima', petName: 'Mel', petBreed: 'Poodle', avatar: '👩' },
  { id: 't4', name: 'Carlos Mendes', petName: 'Nina', petBreed: 'Bulldog', avatar: '👨‍🦱' },
  { id: 't5', name: 'Fernanda Costa', petName: 'Simba', petBreed: 'SRD', avatar: '👩‍🦳' },
  { id: 't6', name: 'Lucas Pereira', petName: 'Mia', petBreed: 'Siamês', avatar: '🧑' },
  { id: 't7', name: 'Mariana Souza', petName: 'Rex', petBreed: 'Golden Retriever', avatar: '👩‍🦱' },
  { id: 't8', name: 'Roberto Alves', petName: 'Bela', petBreed: 'Labrador', avatar: '👴' },
];

export const communityPosts = [
  {
    id: 'p1',
    tutorId: 't1',
    groupId: 'g1',
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=450&fit=crop',
    caption: 'Thor amou a nova ração hipoalergênica! Depois de semanas testando, achamos a ideal. Quem mais tem Golden com alergia alimentar? 🐾',
    likes: 47,
    createdAt: '2026-03-30T10:30:00',
  },
  {
    id: 'p2',
    tutorId: 't2',
    groupId: 'g15',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=450&fit=crop',
    caption: 'Passeio matinal no Ibirapuera com o Bob! Alguém sabe se pode entrar com pet na área do viveiro? 🌳',
    likes: 32,
    createdAt: '2026-03-30T08:15:00',
  },
  {
    id: 'p3',
    tutorId: 't3',
    groupId: 'g14',
    image: 'https://images.unsplash.com/photo-1583337130417-13104dec14a8?w=600&h=450&fit=crop',
    caption: 'Mel finalmente aprendeu a dar a pata! 3 semanas de treino com reforço positivo. Dica: usem petiscos naturais, funciona muito melhor! 🎓✨',
    likes: 89,
    createdAt: '2026-03-29T16:45:00',
  },
  {
    id: 'p4',
    tutorId: 't4',
    groupId: 'g12',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=450&fit=crop',
    caption: 'Dica importante: Nina começou a mancar e levei ao vet. Era uma espiga de capim entre os dedos! Sempre confiram as patinhas depois do passeio 🏥',
    likes: 156,
    createdAt: '2026-03-29T14:20:00',
  },
  {
    id: 'p5',
    tutorId: 't5',
    groupId: 'g6',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=450&fit=crop',
    caption: 'Simba completou 1 ano! De resgatado da rua a rei da casa 👑 Adotem, não comprem! #AdoteNãoCompre',
    likes: 234,
    createdAt: '2026-03-29T11:00:00',
  },
  {
    id: 'p6',
    tutorId: 't6',
    groupId: 'g2',
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=450&fit=crop',
    caption: 'Mia observando os pássaros pela janela — atividade favorita! Gatos Siameses são tão expressivos 😻',
    likes: 78,
    createdAt: '2026-03-28T19:30:00',
  },
  {
    id: 'p7',
    tutorId: 't7',
    groupId: 'g13',
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=450&fit=crop',
    caption: 'Comecei a fazer alimentação natural pro Rex com acompanhamento de nutricionista veterinário. Ele tá amando! Alguém mais faz AN? Compartilhem receitas! 🥩🥕',
    likes: 112,
    createdAt: '2026-03-28T12:00:00',
  },
  {
    id: 'p8',
    tutorId: 't8',
    groupId: 'g7',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=450&fit=crop',
    caption: 'Bela no pet park do Villa Lobos! Ótimo lugar pra socializar. Vamos marcar um encontro de Labs? 🐕🐕',
    likes: 65,
    createdAt: '2026-03-28T09:45:00',
  },
  {
    id: 'p9',
    tutorId: 't1',
    groupId: 'g16',
    image: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=600&h=450&fit=crop',
    caption: 'Flashback de quando Thor era filhote! 8 semanas e já destruindo chinelos 😂 Quem tem foto de filhote do seu pet?',
    likes: 198,
    createdAt: '2026-03-27T15:20:00',
  },
  {
    id: 'p10',
    tutorId: 't3',
    groupId: 'g12',
    image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&h=450&fit=crop',
    caption: 'Check-up anual da Mel concluído! Tudo em dia ✅ Lembrete: vacina antirrábica é obrigatória por lei. Mantenham em dia!',
    likes: 43,
    createdAt: '2026-03-27T10:00:00',
  },
  {
    id: 'p11',
    tutorId: 't5',
    groupId: 'g14',
    image: 'https://images.unsplash.com/photo-1587560699334-bea93391dcef?w=600&h=450&fit=crop',
    caption: 'Simba aprendendo truques! Quem disse que SRD não aprende? É o mais inteligente da turma de adestramento 🏆',
    likes: 167,
    createdAt: '2026-03-26T17:30:00',
  },
  {
    id: 'p12',
    tutorId: 't2',
    groupId: 'g5',
    image: 'https://images.unsplash.com/photo-1579213838058-4a4f4e857a03?w=600&h=450&fit=crop',
    caption: 'Bob no banho — a cara de indignação diz tudo 😂🛁 Labs amam água, menos na hora do banho!',
    likes: 203,
    createdAt: '2026-03-26T14:15:00',
  },
  {
    id: 'p13',
    tutorId: 't4',
    groupId: 'g3',
    image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=450&fit=crop',
    caption: 'Nina ronca mais que meu marido 😂 Bulldogs são assim mesmo? Me contem as histórias engraçadas de vocês!',
    likes: 145,
    createdAt: '2026-03-26T09:00:00',
  },
  {
    id: 'p14',
    tutorId: 't6',
    groupId: 'g13',
    image: 'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=600&h=450&fit=crop',
    caption: 'Trocamos a ração da Mia para uma premium e a diferença na pelagem é incrível! Siameses precisam de muito ômega 3 🐟',
    likes: 56,
    createdAt: '2026-03-25T20:00:00',
  },
  {
    id: 'p15',
    tutorId: 't7',
    groupId: 'g15',
    image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=450&fit=crop',
    caption: 'Rex na praia pela primeira vez! Ele adorou a areia mas ficou com medo das ondas 🌊😄 Dicas para acostumar dogs com o mar?',
    likes: 91,
    createdAt: '2026-03-25T11:30:00',
  },
];

export const communityComments = {
  p1: [
    { id: 'cm1', tutorId: 't3', text: 'Qual marca você escolheu? Minha Mel também tem alergia!', createdAt: '2026-03-30T11:00:00' },
    { id: 'cm2', tutorId: 't7', text: 'Rex usa N&D Ancestral Grain, recomendo demais!', createdAt: '2026-03-30T11:30:00' },
    { id: 'cm3', tutorId: 't1', text: 'Estamos usando a Hills z/d, foi indicação da veterinária 😊', createdAt: '2026-03-30T12:00:00' },
  ],
  p3: [
    { id: 'cm4', tutorId: 't5', text: 'Parabéns! Simba também aprendeu com petisco natural 🎉', createdAt: '2026-03-29T17:00:00' },
    { id: 'cm5', tutorId: 't2', text: 'Quanto tempo por dia vocês treinavam?', createdAt: '2026-03-29T17:30:00' },
    { id: 'cm6', tutorId: 't3', text: '15 minutinhos, 2x por dia! Consistência é tudo 💪', createdAt: '2026-03-29T18:00:00' },
    { id: 'cm7', tutorId: 't8', text: 'Vou tentar com a Bela!', createdAt: '2026-03-29T18:30:00' },
  ],
  p4: [
    { id: 'cm8', tutorId: 't1', text: 'Já aconteceu com Thor! Obrigada pelo alerta 🙏', createdAt: '2026-03-29T15:00:00' },
    { id: 'cm9', tutorId: 't7', text: 'Dica importantíssima! Compartilhando com meu grupo de passeio', createdAt: '2026-03-29T15:30:00' },
    { id: 'cm10', tutorId: 't6', text: 'Com gatos também acontece! Cuidado com plantas no jardim', createdAt: '2026-03-29T16:00:00' },
  ],
  p5: [
    { id: 'cm11', tutorId: 't3', text: 'Que lindo! Adoção é tudo ❤️', createdAt: '2026-03-29T11:30:00' },
    { id: 'cm12', tutorId: 't8', text: 'Parabéns pelo aniversário Simba! 🎂', createdAt: '2026-03-29T12:00:00' },
    { id: 'cm13', tutorId: 't4', text: 'Adotem sim! Nina também é resgatada 🐶', createdAt: '2026-03-29T12:30:00' },
    { id: 'cm14', tutorId: 't2', text: 'Que transformação! De rua a rei, merecido demais 👑', createdAt: '2026-03-29T13:00:00' },
    { id: 'cm15', tutorId: 't1', text: 'Amei! 🥺❤️', createdAt: '2026-03-29T13:30:00' },
  ],
  p7: [
    { id: 'cm16', tutorId: 't4', text: 'Também faço AN! Uso frango, batata doce e cenoura como base', createdAt: '2026-03-28T13:00:00' },
    { id: 'cm17', tutorId: 't1', text: 'Quero começar! Qual nutricionista você indica?', createdAt: '2026-03-28T14:00:00' },
    { id: 'cm18', tutorId: 't5', text: 'Nunca congelem ossos cozidos! Só crus e sob supervisão', createdAt: '2026-03-28T15:00:00' },
  ],
  p12: [
    { id: 'cm19', tutorId: 't4', text: '😂😂😂 Nina faz a mesma cara!', createdAt: '2026-03-26T15:00:00' },
    { id: 'cm20', tutorId: 't7', text: 'Rex ama água MAS só no rio, na banheira é drama total', createdAt: '2026-03-26T15:30:00' },
  ],
};

export const defaultFollowedGroups = ['g1', 'g12', 'g13'];

export const defaultPetCards = {
  '1': {
    city: 'São Paulo',
    personality: 'Brincalhão',
    visibleFields: { name: true, breed: true, age: true, weight: true, city: true, personality: true, photo: true },
  },
  '2': {
    city: 'São Paulo',
    personality: 'Calmo',
    visibleFields: { name: true, breed: true, age: true, weight: false, city: true, personality: true, photo: true },
  },
};
