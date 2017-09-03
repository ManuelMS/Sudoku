const {Grid} = require('./Grid')
class Board{
	constructor(size) {
		this.size=size;
		this.digits = new Grid(size);
		this.isSolved = false;
		this.isValid = false;
	}
	clone() {
		var clone = new Board();
		clone.isSolved = this.isSolved;
		clone.isValid = this.isValid;
		clone.digits = this.digits.clone();
		return clone;
	}
	copyTo(target) {
		target.isSolved = this.isSolved;
		target.isValid = this.isValid;
		target.digits=this.digits.clone();
	}
	getCell(loc) {
		return this.digits.get(loc);
	}
	setCell(loc, value) {
		this.getCell(loc) = value;
	}
	clear() {
		this.digits = this.digits.map(x=>x.clear());
		this.updateAllowed();
	}
	reset() {// return Baord to only the givens
		this.digits = digits.map(x=>x.isGiven()?x:x.clear());
		this.updateAllowed();
	}
	checkIsValidSibs (digit, locs) {
		return checkGeneral(x=>this.getCell(x).getAnswer()==digit, locs) != 0;
	}
	checkGeneral(f, locs){
		return locs.reduce((z,elem)=>f(elem)?z+1:z);
	}
	checkIsValid (loc, digit) {
		// Checks if the digit can go in that location by checking it doesn't
		// exist in either the row, col or square siblings
		if (this.checkIsValidSibs(digit, loc.colSibs()))
			return false;
		if (this.checkIsValidSibs(digit, loc.rowSibs()))
			return false;
		if (this.checkIsValidSibs(digit, loc.squareSibs()))
			return false;
		return true;
	}
	Board.prototype.findCellWithFewestChoices = function () {
		return locs.reduce((z,e)=>this.getCell(e).isAssigned()?z:[z[0]=Math.min(z[0],this.getCell(e).count()),z[1]=e],[9,new Location(-1,-1)])[1];
	};
	checkForHiddenSingles(loc, st) {
		// Check each cell - if not assigned and has no answer then check its siblings
		// get all its allowed then remove all the allowed
		let cell = this.getCell(loc);
		if (!cell.isAssigned() && !cell.hasAnswer()) 
			cell = loc.getSibs(st).reduce((z,elem)=>this.getCell(elem)
														.isAssigned()?z:
																	  z.removeValuesMask(this.getCell(elem)
																							 .getAllowedValuesMask()),this.getCell(loc));
			// if there is only one allowed value left (i.e. this cell is the only one amonsgt its sibs with this allowed value)
			// then apply it as the answer. Note getSingle will return 0 (i.e. no anser) if the number of allowed values is not exactly one
		if (cell.getMaskValue() != 0) {
			cell.setAnswer(answer);
			return true; // no need to check others sibling collections
		}
		return false;
	}
	getValueMask(loc){
		return this.getCell(loc).valueMask();
	}
	getAnswer(locs){
		// cols = 0;
		// rows = 1;
		// squares = 2;
		return locs.reduce((z,e)=>[z[0][e.row]|=this.getValueMask(e),
								   z[1][e.col]|=this.getValueMask(e),
								   z[2][e.getSquare()]|=this.getValueMask(e)],(new Array(3)).fill(new Array(size)));
	}
	updating(loc, answer){
		let contains = answer[0][loc.row] | answer[1][loc.col] | answer[2][loc.getSquare()];
		let cell = this.getCell(loc);
		cell.setAllowed(~contains); // set allowed values to what values are not already set in this row, col or square
		cell.setAnswer(0); //clear any previous answers
		// As an extra step look for "naked singles", i.e. cells that have only one allowed value, and use
		// that to set the answer (note this is different from the "value" as this can only be assigned
		// by the user or any auto solve functions like "accept singles"
		if (!cell.isAssigned()) {
			this.isSolved = false;
			var count = cell.count();
			if (count == 0)
				this.isValid = false;
			else if (count == 1)
				cell.setAnswer(mask.getSingle());
		}
	}
	update(loc){
		if (!this.checkForHiddenSingles(loc, 1))// first check row sibs for a hiddne single
				if (!this.checkForHiddenSingles(loc, 0))// then check cols
					this.checkForHiddenSingles(loc, 2); // then check square
	}
	updateAllowed() {
		// Called whenever the user sets a value or via auto solve
		// Updates the allowed values for each cell based on existing digits
		// entered in a cell's row, col or square
		// First aggregate assigned values to answer
		var locs = Location.grid();//debería ser global
		let Answer = getAnswer(locs);//debería ser global
		// For each cell, aggregate the values already set in that row, col and square.
		// Since the aggregate is a bitmask, the bitwise inverse of that is therefore the allowed values.
		this.isValid = true;
		this.isSolved = true;
		locs.forEach(e=>this.updating(e,answer));

		// Step 2: Look for "hidden singles".
		// For each row, col, square, count number of times each digit appears.
		// If any appear once then set that as the answer for that cell.
		// Count in rows
		locs.forEach(e=>this.update(e));
		// TO DO: Add code here to detect naked/hidden doubles/triples/quads
	}
	trySolve(loc, value) {// empty Location allowed
		if (!loc.isEmpty())// assign a value to a location if provided
		{
			var cell = this.getCell(loc);
			if (!cell.isAllowed(value))
				throw "Internal error.";
			cell.setValue(value);
		}

		do {
			this.updateAllowed();
			if (!this.isValid)
				return false;
		} while (this.acceptPossibles()); // keep doing deterministic answers

		if (this._isSolved)
			return true;

		if (!this._isValid)
			return false;

		// No deterministic solutions, find cell with the fewest choices and try each one in turn
		// until success. 
		var locChoice = this.findCellWithFewestChoices();
		if (locChoice.isEmpty())
			return false;

		var cell = this.getCell(locChoice);
		let boardC = this.clone();
		return cell.allowedValuesArray()
			   .reduce((z,e)=>z?z:boardC.trySolve(locChoice,val)
							   ?(boardC.copyTo(this),true):z,false))

	}
	setString (value) { 
		if (value.length != (size * size))
			return false; 
		Array.from(value).forEach((e,i)=>this.digits[i%9][Math.floor(i/9)].setGiven(isNaN(e)?0:e))
		this.updateAllowed();
		return true;
	}
}
