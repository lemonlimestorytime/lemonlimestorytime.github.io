const text = document.getElementById("text");
const choices = document.getElementById("choices");
const image = document.getElementById("image");
const sound = document.getElementById("sound");

function setChoices(options) {
  choices.innerHTML = "";
  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt.label;
    btn.onclick = opt.action;
    choices.appendChild(btn);
  });
}

function playSound(src) {
  if (src) {
    sound.src = src;
    sound.play();
  }
}

// Endings
function ending(name, img, sfx) {
  text.textContent = "Ending: " + name;
  image.src = img;
  playSound(sfx);
  choices.innerHTML = "";
  const restart = document.createElement("button");
  restart.textContent = "Play Again";
  restart.onclick = startGame;
  choices.appendChild(restart);
}

// Game Flow
function startGame() {
  text.textContent = "You see a glue stick. What do you do?";
  image.src = "images/glue_stick.png";
  setChoices([
    {label: "Eat it", action: () => ending("Glue stick eater", "images/glue_stick_eater.png", "sounds/cartoon_chomp.wav")},
    {label: "Leave it", action: () => ending("Responsible", "images/responsible.png", "sounds/success_fanfare.wav")},
    {label: "Melt it into liquid", action: () => meltGlue()}
  ]);
}

function meltGlue() {
  text.textContent = "You melted the glue into liquid. What do you do?";
  image.src = "images/bowl_glue.png";
  playSound("sounds/bubble-pop.mp3");
  setChoices([
    {label: "Drink it", action: () => ending("Glue stick drinker", "images/glue_stick_drinker.png", "sounds/glugging_drink.wav")},
    {label: "Leave it", action: () => ending("Responsible", "images/responsible.png", "sounds/success_fanfare.wav")},
    {label: "Add ingredients", action: () => addIngredients()}
  ]);
}

function addIngredients() {
  text.textContent = "Which ingredient do you add?";
  image.src = "images/add_ingredients.png";
  playSound("sounds/mixing_bowl.wav");
  setChoices([
    {label: "Add chocolate", action: () => ingredientChoice("chocolate")},
    {label: "Add honey", action: () => ingredientChoice("honey")},
    {label: "Add cinnamon", action: () => ingredientChoice("cinnamon")}
  ]);
}

function ingredientChoice(ingredient) {
  text.textContent = "You added " + ingredient + ". What do you do?";
  image.src = `images/bowl_glue_${ingredient}.png`;
  playSound("sounds/pouring_liquid.wav");
  setChoices([
    {label: "Drink glue with " + ingredient, action: () => ending("Glue with ingredients drinker", "images/glue_with_ingredients_drinker.png", "sounds/glugging_drink.wav")},
    {label: "Do not", action: () => ending("Pointless ingredients", "images/pointless_ingredients.png", "sounds/bruh.mp3")}
  ]);
}

// Start the game
startGame();