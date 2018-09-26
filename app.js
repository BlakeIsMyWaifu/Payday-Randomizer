const readline = require('readline'),
	chalk = require('chalk'),
	heists = require('./data/heists.json'),
	perkDecks = require('./data/perkDecks.json'),
	primary = require('./data/primary.json'),
	secondary = require('./data/secondary.json'),
	throwable = require('./data/throwable.json'),
	deployables = require('./data/deployables.json'),
	log = (c, m) => console.log(chalk[c](m)),
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
Array.prototype.random = function() {return this[Math.floor(Math.random() * this.length)];};
Array.prototype.randomNotFirst = function() {return this[Math.floor(Math.random() * (this.length - 1)) + 1];};
function removeDup(a) {
	return a.filter(function(i, p) {
		return a.indexOf(i) == p;
	});
}
var x = {};

var randomizer; (randomizer = function randomizer() {
	rl.question(chalk.magenta('What would you like randomized: '), r => {
		r = r.split(' ');
		var search = r.shift().toLowerCase(), options = r;
		let alias = {
			"a": "all",
			"h": "heist",
			"p": "perk",
			"pd": "perk",
			"perkdeck": "perk",
			"primary": ["weapon", primary],
			"secondary": ["weapon", secondary],
			"g": "gun",
			"t": "throwable",
			"throw": "throwable",
			"d": "deployable"
		};
		Object.keys(alias).forEach(function(a) {
			if (search === a) search = alias[a];
		});
		if (x[search] === undefined && x[search[0]] === undefined) {
			x.err();
		} else if (typeof search === 'string') {
			log('cyanBright', x[search](options));
		} else {
			log('cyanBright', x[search[0]](options, search[1]));
		}
		console.log();
		randomizer();
	});
})();

x.err = function () {
	log('red', ('Unknown Argument [all / heist / perk / primary / secondary / throwable / deployable]\n'));
};

x.help = function () {
	let cmds = [
		['help', 'Displays all commands'],
		['close', 'Closes the process'],
		['all', 'Random 1 of everything'],
		['heist', 'Random Heist [min:DIFFICULTY max:DIFFICULTY days:DAYS loud stealth c:CONTRACTOR]'],
		['perk', 'Random Perk Deck [>RANK <RANK =RANK]'],
		['primary', 'Random Primary Gun [<type>]'],
		['secondary', 'Random Secondary Gun [<type>]'],
		['guns', 'Random Primary and Secondary Gun'],
		['throwable', 'Random Throwable'],
		['deployable', 'Random deployable [stealth both]']
	];
	let cmdArr = [];
	cmds.forEach(function(cmd) {
		cmdArr.push(chalk.green(cmd[0]) + ` - ${cmd[1]}`);
	});
	return cmdArr.join('\n');
};

x.close = function () {
	console.log(':(\n');
	process.exit(1);
};

x.all = function () {
	let a = [
		heists.random().name,
		x.perk([]).split(' (')[0],
		x.weapon([], primary),
		x.weapon([], secondary),
	];
	let perk = a[1].split(' (')[0];
	if (typeof perkDecks[perk] === 'number') a.push(x.throwable([]));
	let tactic = a[0].split('- ');
	if (tactic[a[0].split('- ').length - 1].startsWith('Stealth')) {
		if (tactic[a[0].split('- ').length - 2].startsWith('Loud')) {
			a.push(x.deployable(['both']));
		} else {
			a.push(x.deployable(['stealth']));
		}
	} else {
		a.push(x.deployable(['loud']));
	}
	return a.join('\n');
}

x.heist = function (options) {
	var h = heists;
	var filter = {
		'min': function (v) {
			return h.filter(h => h.difficulty[0] >= v || h.difficulty[1] >= v);
		},
		'max': function (v) {
			return h.filter(h => h.difficulty[0] <= v && h.difficulty[1] <= v);
		},
		'd': function(v) {
			return h.filter(h => h.days.toString() === v);
		},
		'l': function() {
			return h.filter(h => h.difficulty[0] !== null);
		},
		's': function() {
			return h.filter(h => h.difficulty[1] !== null);
		},
		'c': function(v) {
			return h.filter(h => h.contractor.toLowerCase() === v.toLowerCase());
		}
	};
	options.forEach(function(f) {
		f = f.split(':');
		var alias = {
			"days": "d",
			"day": "d",
			"loud": "l",
			"stealth": "s",
			"contractor": "c"
		};
		Object.keys(alias).forEach(function(a) {
			f[0] = f[0].replace(a, alias[a]);
		});
		if (Object.keys(filter).includes(f[0])) {
			h = filter[f[0]](f[1]);
		}
	});
	if (h.length === 0) h = heists;
	h = h.random();
	var d = [
		typeof h.name === 'string' ? h.name : `${h.name[0]}: ${h.name.randomNotFirst()}`,
		`${h.days} day${h.days === 1 ? '' : 's'}`,
		'Contractor: ' + h.contractor,
	];
	if (h.difficulty[0] !== null) d.push(`Loud Difficulty: (${h.difficulty[0]} / 10)`);
	if (h.difficulty[1] !== null) d.push(`Stealth Difficulty: (${h.difficulty[1]} / 10)`);
	return '- ' + d.join('\n- ');
};

x.perk = function (options) {
	var pd = {};
	if (options.length !== 0) {
		let operator = options[0].substring(0, 1);
		let number = options[0].substring(1);
		var o = {
			"=": function (p, f) {
				return f.toString() === number;
			},
			">": function (p, f) {
				return f.toString() >= number;
			},
			"<": function (p, f) {
				return f.toString() <= number;
			}
		}
		Object.keys(perkDecks).forEach(function(p) {
			let f = typeof perkDecks[p] === 'number' ? perkDecks[p] : perkDecks[p][0];
			if (o[operator](p, f)) {
				pd[p] = number;
			}
		});
	}
	if (Object.keys(pd).length === 0) pd = perkDecks;
	pd = Object.keys(pd).random();
	return pd + ` (${typeof perkDecks[pd] === 'number' ? perkDecks[pd] : perkDecks[pd][0]} / 10)`;
};

x.weapon = function (options, slot) {
	var type = Object.keys(slot).random();
	if (options.length !== 0) {
		options = options.join(' ').toLowerCase();
		if (options in slot) type = options;
	}
	var gun = slot[type].random();
	return `${type}: ${gun}`;
};

x.throwable = function (options) {
	return throwable.random();
};

x.deployable = function (options) {
	var dep = "loud";
	if (options[0] === 's' || options[0] === 'stealth') dep = "stealth";
	var d = deployables[dep];
	if (options[0] === 'b' || options[0] === 'both') {
		d = removeDup(deployables.loud.concat(deployables.stealth));
	}
	return d.random();
};

x.guns = function () {
	var p = x.weapon('', primary),
		s = x.weapon('', secondary)
	return p + '\n' + s;
};
