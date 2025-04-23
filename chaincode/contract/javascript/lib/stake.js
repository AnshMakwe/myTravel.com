'use strict';

const { Contract } = require('fabric-contract-api');
const { DateTime } = require('luxon');

const customerPrefix = 'customer';
const providerPrefix = 'provider';
const travelOptionPrefix = 'travelOption';
const ticketPrefix = 'ticket';

class TravelTicket extends Contract {

  
    async initLedger(ctx) {
        console.info('=== Initializing Ledger ===');
        // Optionally add pre-defined travel options or sample data here.
        console.info('Ledger initialization complete.');
    }

  
    async registerCustomer(ctx, name, contact) {
        const customerId = ctx.clientIdentity.getID();
        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        if (customerBytes && customerBytes.length > 0) {
            throw new Error('Customer already registered.');
        }
        const customerData = {
            customerId,
            wallet: customerId,
            name,
            contact,
            balance: 1000,
            bookings: []  // list of ticket composite keys
        };
        console.info('Hello world');
        await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
        return customerData;
    }

  
    async registerProvider(ctx, name, contact, rating, serviceProvider) {
        const providerId = ctx.clientIdentity.getID();
        const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
        const providerBytes = await ctx.stub.getState(providerKey);
        if (providerBytes && providerBytes.length > 0) {
            throw new Error('Provider already registered.');
        }
        const providerData = {
            providerId,
            name,
            contact,
            rating: rating || 0,
            numRatings: 0,// number of ratings received
            serviceProvider,
            balance: 100,         
            travelOptions: []   
        };
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        return providerData;
    }

   
    async updateCustomerDetails(ctx, newName, newContact, isAnonymous) {
    const customerId = ctx.clientIdentity.getID();
    const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
    const customerBytes = await ctx.stub.getState(customerKey);
    if (!customerBytes || customerBytes.length === 0) {
        throw new Error('Customer not registered.');
    }
    let customerData = JSON.parse(customerBytes.toString());
    
    const anonymousFlag = typeof isAnonymous === 'string' 
      ? isAnonymous.toLowerCase() === 'true' 
      : Boolean(isAnonymous);
    
    customerData.name = anonymousFlag ? '_____' : (newName || customerData.name);
    customerData.contact = anonymousFlag ? null : (newContact || customerData.contact);
    
    await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
    return customerData;
}






    async depositFunds(ctx, amount) {
        const customerId = ctx.clientIdentity.getID();
        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        if (!customerBytes || customerBytes.length === 0) {
            throw new Error('Customer not registered.');
        }
        let customerData = JSON.parse(customerBytes.toString());
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            throw new Error('Deposit amount must be a positive number.');
        }
        customerData.balance += depositAmount;
        await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
        return customerData;
    }


    async updateProviderDetails(ctx, newName, newContact, newRating, isAnonymous) {
        const providerId = ctx.clientIdentity.getID();
        const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
        const providerBytes = await ctx.stub.getState(providerKey);
        if (!providerBytes || providerBytes.length === 0) {
            throw new Error('Provider not registered.');
        }
        let providerData = JSON.parse(providerBytes.toString());
        providerData.name = newName || providerData.name;
        providerData.contact = isAnonymous ? null : (newContact || providerData.contact);
        providerData.rating = providerData.rating;
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        return providerData;
    }

async addTravelOption(ctx, source, destination, departureDate, departureTime, transportMode, seatCapacity, basePrice) {
    const txTimestamp = ctx.stub.getTxTimestamp();
    

    
    const now = DateTime.now().setZone('Asia/Kolkata'); // current time in IST
    const departureDateTime = DateTime.fromFormat(
      `${departureDate} ${departureTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: 'Asia/Kolkata' }
    );
    if (departureDateTime <= now) {
        throw new Error('Cannot add travel option: departure time has already passed.');
    }


    const providerId = ctx.clientIdentity.getID();
    const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
    const providerBytes = await ctx.stub.getState(providerKey);
    if (!providerBytes || providerBytes.length === 0) {
        throw new Error('Provider not registered.');
    }
    let providerData = JSON.parse(providerBytes.toString());


    providerData.balance -= 5;


    for (const existingOptionId of providerData.travelOptions) {
        const existingOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [existingOptionId]);
        const existingOptionBytes = await ctx.stub.getState(existingOptionKey);
        if (existingOptionBytes && existingOptionBytes.length > 0) {
            const existingOption = JSON.parse(existingOptionBytes.toString());
            if (!existingOption.status || existingOption.status !== 'CANCELLED') {
                if (
                    existingOption.source === source &&
                    existingOption.destination === destination &&
                    existingOption.departureDate === departureDate &&
                    existingOption.departureTime === departureTime &&
                    existingOption.transportMode === transportMode &&
                    parseInt(existingOption.seatCapacity) === parseInt(seatCapacity) &&
                    parseFloat(existingOption.basePrice) === parseFloat(basePrice)
                ) {
                    throw new Error('A non-cancelled travel option with the same details already exists.');
                }
            }
        }
    }

    // Generate a new travelOptionId using the timestamp
    const timestamp = txTimestamp.seconds.low.toString();
    const travelOptionId = `${source}_${destination}_${departureDate}_${departureTime}_${providerId}_${timestamp}`;
    const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);

    const travelOptionData = {
        travelOptionId,
        providerId,
        serviceProvider: providerData.serviceProvider,
        source,
        destination,
        departureDate,
        departureTime,
        transportMode,
        bookedSeats: [],
        seatCapacity: parseInt(seatCapacity, 10),
        availableSeats: parseInt(seatCapacity, 10),
        basePrice: parseFloat(basePrice)
    };

    await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));

    providerData.travelOptions.push(travelOptionId);
    await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));

    return travelOptionData;
}






        async listTravelOptions(ctx, source, destination) {
    const iterator = await ctx.stub.getStateByPartialCompositeKey(travelOptionPrefix, []);
    const options = [];
    
    
    const now = DateTime.now().setZone('Asia/Kolkata'); 
    while (true) {
        const res = await iterator.next();
        if (res.value && res.value.value.toString()) {
            const record = JSON.parse(res.value.value.toString('utf8'));

            if (record.source === source && record.destination === destination) {
            
                const departure = DateTime.fromFormat(
                          `${record.departureDate} ${record.departureTime}`,
                          'yyyy-MM-dd HH:mm',
                          { zone: 'Asia/Kolkata' }
                        );

               
                if (departure > now) {
                    options.push(record);
                }
            }
        }

        if (res.done) {
            await iterator.close();
            return options;
        }
    }
}


   
    async listTravelOptionsSorted(ctx, source, destination, inputdate, sortBy, minPrice, maxPrice, filterProviderId, onlyAvailable) {
    let options = await this.listTravelOptions(ctx, source, destination);
    
  
    if (inputdate) {
        options = options.filter(opt => opt.departureDate === inputdate);
    }
    
  
    if (onlyAvailable && onlyAvailable.toLowerCase() === 'true') {
        options = options.filter(opt => opt.availableSeats > 0);
    }
  
    if (minPrice) {
        options = options.filter(opt => parseFloat(opt.basePrice) >= parseFloat(minPrice));
    }
    if (maxPrice) {
        options = options.filter(opt => parseFloat(opt.basePrice) <= parseFloat(maxPrice));
    }
    
    if (filterProviderId) {
        options = options.filter(opt => opt.serviceProvider === filterProviderId);
    }

    for (let i = 0; i < options.length; i++) {
            const providerKey = ctx.stub.createCompositeKey(providerPrefix, [options[i].providerId]);
            const providerBytes = await ctx.stub.getState(providerKey);
            if (providerBytes && providerBytes.length > 0) {
                const providerData = JSON.parse(providerBytes.toString());
                options[i].providerRating = providerData.rating;
                options[i].totalRating = providerData.numRatings;
            } else {
                options[i].providerRating = 0;
                options[i].totalRating = 0;
            }
        }
    if (sortBy === 'price') {
        options.sort((a, b) => a.basePrice - b.basePrice);
    } else if (sortBy === 'rating') {
        options.sort((a, b) => b.providerRating - a.providerRating);
    } else if (sortBy === 'transportMode') {
        options.sort((a, b) => a.transportMode.localeCompare(b.transportMode));
    }
    return options;
}





 
async bookTicket(ctx, travelOptionId, seatnumber) {
    const customerId = ctx.clientIdentity.getID();
    const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
    const customerBytes = await ctx.stub.getState(customerKey);
    if (!customerBytes || customerBytes.length === 0) {
        throw new Error('Customer not registered.');
    }
    let customerData = JSON.parse(customerBytes.toString());

    const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
    const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
    if (!travelOptionBytes || travelOptionBytes.length === 0) {
        throw new Error('Travel option does not exist.');
    }
    let travelOptionData = JSON.parse(travelOptionBytes.toString());
    
    const now = DateTime.now().setZone('Asia/Kolkata'); // current time in IST
    const departureDateTime = DateTime.fromFormat(
      `${travelOptionData.departureDate} ${travelOptionData.departureTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: 'Asia/Kolkata' }
    );


    if (departureDateTime <= now) {
        throw new Error('Cannot book ticket: departure time has already passed.');
    }


    if (travelOptionData.availableSeats <= 0) {
        throw new Error('No seats available.');
    }

    const requestedSeatNumber = parseInt(seatnumber, 10);
    if (isNaN(requestedSeatNumber) || requestedSeatNumber < 1 || requestedSeatNumber > travelOptionData.seatCapacity) {
        throw new Error('Seat number must be a number between 1 and the maximum seat capacity.');
    }

  
    const ticketIterator = await ctx.stub.getStateByPartialCompositeKey(ticketPrefix, [travelOptionId]);
    while (true) {
        const res = await ticketIterator.next();
        if (res.value && res.value.value.toString()) {
            let ticket = JSON.parse(res.value.value.toString('utf8'));
            if (ticket.status !== 'CANCELLED' && ticket.seatNumber === requestedSeatNumber) {
                await ticketIterator.close();
                throw new Error('Requested seat number is already booked.');
            }
        }
        if (res.done) {
            await ticketIterator.close();
            break;
        }
    }


    if (Array.isArray(travelOptionData.bookedSeats) &&
        travelOptionData.bookedSeats.includes(requestedSeatNumber)) {
        throw new Error('Requested seat number is already booked.');
    }

  
    const bookedCount = travelOptionData.seatCapacity - travelOptionData.availableSeats;
    const occupancyFactor = bookedCount / travelOptionData.seatCapacity;
    const dynamicFactor = 0.5;
    let dynamicPrice = travelOptionData.basePrice * (1 + occupancyFactor * dynamicFactor);
    const maxPrice = travelOptionData.basePrice * 1.5;
    if (dynamicPrice > maxPrice) dynamicPrice = maxPrice;

    if (customerData.balance < dynamicPrice) {
        throw new Error('Insufficient balance for booking.');
    }
    customerData.balance -= (dynamicPrice + 5);

    const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
    const providerBytes = await ctx.stub.getState(providerKey);
    let providerData = JSON.parse(providerBytes.toString());
    providerData.balance += dynamicPrice;


    travelOptionData.availableSeats -= 1;
    travelOptionData.bookedSeats = travelOptionData.bookedSeats || [];
    travelOptionData.bookedSeats.push(requestedSeatNumber);
    await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));


    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = txTimestamp.seconds.low.toString();
    const bookingTime = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const ticketCompositeKey = ctx.stub.createCompositeKey(ticketPrefix, [travelOptionId, customerId, timestamp]);

    const ticketData = {
        ticketId: ticketCompositeKey,
        travelOptionId,
        customerId,
        seatNumber: requestedSeatNumber,
        bookingTime,
        timestamp,
        pricePaid: dynamicPrice,
        status: 'PENDING_CONFIRMATION',
        confirmationCount: 0,
        pricingBreakdown: {
            basePrice: travelOptionData.basePrice,
            occupancyFactor,
            dynamicFactor,
            dynamicPrice
        }
    };

    await ctx.stub.putState(ticketCompositeKey, Buffer.from(JSON.stringify(ticketData)));

    customerData.bookings.push(ticketCompositeKey);
    await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
    await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));

    return ticketData;
}





async bookTicket1(ctx, travelOptionId, seatnumber, customerRefund, oldProviderKey) {
    const customerId = ctx.clientIdentity.getID();
    const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
    const customerBytes = await ctx.stub.getState(customerKey);
    if (!customerBytes || customerBytes.length === 0) {
        throw new Error('Customer not registered.');
    }
    let customerData = JSON.parse(customerBytes.toString());

    const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
    const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
    if (!travelOptionBytes || travelOptionBytes.length === 0) {
        throw new Error('Travel option does not exist.');
    }
    let travelOptionData = JSON.parse(travelOptionBytes.toString());
    
    
    
    const now = DateTime.now().setZone('Asia/Kolkata'); // current time in IST
    const departureDateTime = DateTime.fromFormat(
      `${travelOptionData.departureDate} ${travelOptionData.departureTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: 'Asia/Kolkata' }
    );
        
    if (departureDateTime <= now) {
        throw new Error('Cannot book ticket: departure time has already passed.');
    }

    

   
    if (travelOptionData.availableSeats <= 0) {
        throw new Error('No seats available.');
    }

 
    const requestedSeatNumber = parseInt(seatnumber, 10);
    if (isNaN(requestedSeatNumber) || requestedSeatNumber < 1 || requestedSeatNumber > travelOptionData.seatCapacity) {
        throw new Error('Seat number must be a number between 1 and the maximum seat capacity.');
    }

    
    const ticketIterator = await ctx.stub.getStateByPartialCompositeKey(ticketPrefix, [travelOptionId]);
    while (true) {
        const res = await ticketIterator.next();
        if (res.value && res.value.value.toString()) {
            let ticket = JSON.parse(res.value.value.toString('utf8'));
            // Consider a seat booked if its ticket status is not CANCELLED.
            if (ticket.status !== 'CANCELLED' && ticket.seatNumber === requestedSeatNumber) {
                await ticketIterator.close();
                throw new Error('Requested seat number is already booked.');
            }
        }
        if (res.done) {
            await ticketIterator.close();
            break;
        }
    }

  
    if (travelOptionData.bookedSeats && Array.isArray(travelOptionData.bookedSeats)) {
        if (travelOptionData.bookedSeats.includes(requestedSeatNumber)) {
            throw new Error('Requested seat number is already booked.');
        }
    }


    const bookedCount = travelOptionData.seatCapacity - travelOptionData.availableSeats;
    const occupancyFactor = bookedCount / travelOptionData.seatCapacity;
    const dynamicFactor = 0.5;
    let dynamicPrice = travelOptionData.basePrice * (1 + occupancyFactor * dynamicFactor);
    const maxPrice = travelOptionData.basePrice * 1.5;
    if (dynamicPrice > maxPrice) {
        dynamicPrice = maxPrice;
    }

    if (customerData.balance < dynamicPrice) {
        throw new Error('Insufficient balance for booking.');
    }
    customerData.balance += customerRefund;
    customerData.balance -= dynamicPrice;

    const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
    const providerBytes = await ctx.stub.getState(providerKey);
    let providerData = JSON.parse(providerBytes.toString());
    
    const oldproviderBytes = await ctx.stub.getState(oldProviderKey);
    let oldproviderData = JSON.parse(oldproviderBytes.toString());
    if(providerKey === oldProviderKey)
    {
        providerData.balance -= customerRefund;
        providerData.balance += dynamicPrice;
    }
    else
    {
        oldproviderData.balance -= customerRefund;
        providerData.balance += dynamicPrice;   
        await ctx.stub.putState(oldProviderKey, Buffer.from(JSON.stringify(oldproviderData)));
    }
    

   
    await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
    await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));

    
    travelOptionData.availableSeats -= 1;
    if (!travelOptionData.bookedSeats) {
        travelOptionData.bookedSeats = [];
    }
    travelOptionData.bookedSeats.push(requestedSeatNumber);
    await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));


    const txTimestamp = ctx.stub.getTxTimestamp();
    const timestamp = txTimestamp.seconds.low.toString();
    const bookingTime = new Date(txTimestamp.seconds.low * 1000).toISOString();
    const ticketCompositeKey = ctx.stub.createCompositeKey(ticketPrefix, [travelOptionId, customerId, timestamp]);
    const encodedKey = Buffer.from(ticketCompositeKey).toString('base64').toString('utf8');


    const ticketData = {
        ticketId: ticketCompositeKey,
        travelOptionId,
        customerId,
        encodedKey,
        seatNumber: requestedSeatNumber,
        bookingTime,
        timestamp,
        pricePaid: dynamicPrice,

        status: 'PENDING_CONFIRMATION',
        confirmationCount: 0,
        pricingBreakdown: {
            basePrice: travelOptionData.basePrice,
            occupancyFactor: occupancyFactor,
            dynamicFactor: dynamicFactor,
            dynamicPrice: dynamicPrice
        }
    };

    await ctx.stub.putState(ticketCompositeKey, Buffer.from(JSON.stringify(ticketData)));
    customerData.bookings.push(ticketCompositeKey);
    await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));

    return ticketData;
}












 
    async confirmTicket(ctx, ticketCompositeKey) {
        const ticketBytes = await ctx.stub.getState(ticketCompositeKey);
        if (!ticketBytes || ticketBytes.length === 0) {
          throw new Error('Ticket does not exist.');
        }
        let ticketData = JSON.parse(ticketBytes.toString());
        if (ticketData.status !== 'PENDING_CONFIRMATION') {
          throw new Error('Ticket is not pending confirmation.');
        }
        ticketData.confirmationCount += 1;
        if (ticketData.confirmationCount >= 1) {
          ticketData.status = 'CONFIRMED';
        }
        await ctx.stub.putState(ticketCompositeKey, Buffer.from(JSON.stringify(ticketData)));
        return ticketData;
    }




    async cancelTicket(ctx, ticketId, currentTimestamp) {
        const customerId = ctx.clientIdentity.getID();
        const ticketKey = ticketId;
        const ticketBytes = await ctx.stub.getState(ticketKey);
        if (!ticketBytes || ticketBytes.length === 0) {
            throw new Error('Ticket does not exist.');
        }
        let ticketData = JSON.parse(ticketBytes.toString());
        if (ticketData.customerId !== customerId) {
            throw new Error('Not authorized to cancel this ticket.');
        }
        if (ticketData.status !== 'PENDING_CONFIRMATION' && ticketData.status !== 'CONFIRMED') {
            throw new Error('Ticket cannot be cancelled.');
        }

        const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [ticketData.travelOptionId]);
        const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
        let travelOptionData = JSON.parse(travelOptionBytes.toString());

        const departureTime = new Date(`${travelOptionData.departureDate}T${travelOptionData.departureTime}`);
        const currentTime = new Date(currentTimestamp);
        const msInTwoDays = 2 * 24 * 60 * 60 * 1000;
        const msInOneDays = 24 * 60 * 60 * 1000;
        let refundAmount = 0;
        if ((departureTime - currentTime) >= msInTwoDays) {
            refundAmount = ticketData.pricePaid;
        }
        else if((departureTime - currentTime) >= msInOneDays){
            refundAmount = 0.8 * ticketData.pricePaid;
        }
        
        ticketData.status = 'CANCELLED';
        await ctx.stub.putState(ticketKey, Buffer.from(JSON.stringify(ticketData)));

        travelOptionData.availableSeats += 1;
     
        if (travelOptionData.bookedSeats && Array.isArray(travelOptionData.bookedSeats)) {
            const index = travelOptionData.bookedSeats.indexOf(ticketData.seatNumber);
            if (index !== -1) {
                travelOptionData.bookedSeats.splice(index, 1);
            }
        }
        await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));


        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        let customerData = JSON.parse(customerBytes.toString());
        if (refundAmount > 0) {
            customerData.balance += refundAmount;
            const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
            const providerBytes = await ctx.stub.getState(providerKey);
            let providerData = JSON.parse(providerBytes.toString());
            providerData.balance -= refundAmount;
            await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        }
        await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));

        return ticketData;
    }

    async rescheduleTicket(ctx, encodedTicketId, newTravelOptionId, currentTimestamp, selectedSeat) {
    // Decode the old ticket composite key
    const ticketBytes = await ctx.stub.getState(encodedTicketId);
    if (!ticketBytes || ticketBytes.length === 0) {
        throw new Error('Ticket does not exist.');
    }
    let oldTicket = JSON.parse(ticketBytes.toString());
    if (oldTicket.status !== 'PENDING_CONFIRMATION' && oldTicket.status !== 'CONFIRMED') {
        throw new Error('Only active tickets can be rescheduled.');
    }

   
    const oldTravelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [oldTicket.travelOptionId]);
    const oldTravelOptionBytes = await ctx.stub.getState(oldTravelOptionKey);
    if (!oldTravelOptionBytes || oldTravelOptionBytes.length === 0) {
        throw new Error('Old travel option does not exist.');
    }
    let oldTravelOption = JSON.parse(oldTravelOptionBytes.toString());


    const departureTime = new Date(`${oldTravelOption.departureDate}T${oldTravelOption.departureTime}`);
    const currentTime = new Date(currentTimestamp);
    const msInTwoDays = 2 * 24 * 60 * 60 * 1000;
    const msInOneDay = 24 * 60 * 60 * 1000;
    let refundAmount = 0;
    if ((departureTime - currentTime) >= msInTwoDays) {
        refundAmount = oldTicket.pricePaid;
    } else if ((departureTime - currentTime) >= msInOneDay) {
        refundAmount = oldTicket.pricePaid * 0.8;
    }

    // Cancel the old ticket.
    oldTicket.status = 'CANCELLED';
    await ctx.stub.putState(encodedTicketId, Buffer.from(JSON.stringify(oldTicket)));

    oldTravelOption.availableSeats += 1;
    if (oldTravelOption.bookedSeats && Array.isArray(oldTravelOption.bookedSeats)) {
        const index = oldTravelOption.bookedSeats.indexOf(oldTicket.seatNumber);
        if (index !== -1) {
            oldTravelOption.bookedSeats.splice(index, 1);
        }
    }
    await ctx.stub.putState(oldTravelOptionKey, Buffer.from(JSON.stringify(oldTravelOption)));
    const providerKey = ctx.stub.createCompositeKey(providerPrefix, [oldTravelOption.providerId]);
  
    
    

    const newTicket = await this.bookTicket1(ctx, newTravelOptionId, selectedSeat, refundAmount, providerKey);

 
    newTicket.rescheduledFrom = oldTicket.ticketId;
    await ctx.stub.putState(newTicket.ticketId, Buffer.from(JSON.stringify(newTicket)));

    return newTicket;
}


















    async deleteTravelOption(ctx, travelOptionId) {
    const providerId = ctx.clientIdentity.getID();
    const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
    const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
    if (!travelOptionBytes || travelOptionBytes.length === 0) {
        throw new Error('Travel option does not exist.');
    }
    const travelOptionData = JSON.parse(travelOptionBytes.toString());

    const txTimestamp = ctx.stub.getTxTimestamp();
    
    const now = DateTime.now().setZone('Asia/Kolkata'); // current time in IST
    const departureDateTime = DateTime.fromFormat(
      `${travelOptionData.departureDate} ${travelOptionData.departureTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: 'Asia/Kolkata' }
    );
    
    if (now >= departure) {
        throw new Error('Cannot delete travel option after its departure time.');
    }


    if (travelOptionData.providerId !== providerId) {
        throw new Error('Not authorized to delete this travel option.');
    }
    if (travelOptionData.availableSeats !== travelOptionData.seatCapacity) {
        throw new Error('Cannot delete travel option with active bookings.');
    }
    await ctx.stub.deleteState(travelOptionKey);
    return { message: 'Travel option deleted successfully.' };
}


async cancelTravelListing(ctx, travelOptionId) {
    const providerId = ctx.clientIdentity.getID();
    const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
    const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
    if (!travelOptionBytes || travelOptionBytes.length === 0) {
        throw new Error('Travel option does not exist.');
    }

    let travelOptionData = JSON.parse(travelOptionBytes.toString());
    if (travelOptionData.providerId !== providerId) {
        throw new Error('Not authorized to cancel this travel option.');
    }


    const txTimestamp = ctx.stub.getTxTimestamp();
    
    
    const now = DateTime.now().setZone('Asia/Kolkata');
    const departureDateTime = DateTime.fromFormat(
      `${travelOptionData.departureDate} ${travelOptionData.departureTime}`,
      'yyyy-MM-dd HH:mm',
      { zone: 'Asia/Kolkata' }
    );

    const refundAllowed = now < departureDateTime;

    const iterator = await ctx.stub.getStateByPartialCompositeKey(ticketPrefix, [travelOptionId]);
    let ticketsToCancel = [];
    let totalRefund = 0;

    while (true) {
        const res = await iterator.next();
        if (res.value && res.value.value.toString()) {
            let ticket = JSON.parse(res.value.value.toString('utf8'));
            if (ticket.status === 'PENDING_CONFIRMATION' || ticket.status === 'CONFIRMED') {
                ticketsToCancel.push({ key: res.value.key, ticket });
                if (refundAllowed) {
                    totalRefund += ticket.pricePaid;
                }
            }
        }
        if (res.done) {
            await iterator.close();
            break;
        }
    }


    for (const { key, ticket } of ticketsToCancel) {
        if (refundAllowed) {
            const customerKey = ctx.stub.createCompositeKey(customerPrefix, [ticket.customerId]);
            const customerBytes = await ctx.stub.getState(customerKey);
            if (customerBytes && customerBytes.length > 0) {
                let customerData = JSON.parse(customerBytes.toString());
                customerData.balance += ticket.pricePaid;
                await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
            }
        }
        ticket.status = 'CANCELLED';
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(ticket)));
    }


    const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
    const providerBytes = await ctx.stub.getState(providerKey);
    let providerData = JSON.parse(providerBytes.toString());
    if (refundAllowed) {
        providerData.balance -= totalRefund;
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
    }


    travelOptionData.status = 'CANCELLED';
    travelOptionData.availableSeats = travelOptionData.seatCapacity;
    await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));

    const msg = refundAllowed
      ? `Travel listing cancelled, ${ticketsToCancel.length} bookings refunded, total refund: ${totalRefund}`
      : `Travel listing cancelled after departure; no refunds processed.`;
    return { message: msg };
}



    async getCustomerTickets(ctx) {
        const customerId = ctx.clientIdentity.getID();
        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        if (!customerBytes || customerBytes.length === 0) {
            throw new Error('Customer not registered.');
        }
        const customerData = JSON.parse(customerBytes.toString());
        const tickets = [];
        for (const ticketKey of customerData.bookings) {
            const ticketBytes = await ctx.stub.getState(ticketKey);
            if (ticketBytes && ticketBytes.length > 0) {
                tickets.push(JSON.parse(ticketBytes.toString()));
            }
        }
        return tickets;
    }


    async getCustomerDetails(ctx) {
        const customerId = ctx.clientIdentity.getID();
        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        if (!customerBytes || customerBytes.length === 0) {
            throw new Error('Customer not registered.');
        }
        return customerBytes.toString();
    }


    async getTicketDetails(ctx, encodedTicketId) {
        const compositeKey = encodedTicketId;
        //const compositeKey = Buffer.from(encodedTicketId, 'base64').toString('utf8');
        const ticketBytes = await ctx.stub.getState(compositeKey);
        if (!ticketBytes || ticketBytes.length === 0) {
            throw new Error('Ticket does not exist.');
        }
        return ticketBytes.toString();
}





async listTravelOptionsSorted1(ctx, source, destination, sortBy, minPrice, maxPrice, filterProviderId, onlyAvailable) {
        let options = await this.listTravelOptions(ctx, source, destination);
     
       
        if (onlyAvailable && onlyAvailable.toLowerCase() === 'true') {
            options = options.filter(opt => opt.availableSeats > 0);
        }

        if (minPrice) {
            options = options.filter(opt => parseFloat(opt.basePrice) >= parseFloat(minPrice));
        }
        if (maxPrice) {
            options = options.filter(opt => parseFloat(opt.basePrice) <= parseFloat(maxPrice));
        }
    
        if (filterProviderId) {
            options = options.filter(opt => opt.serviceProvider === filterProviderId);
        }
  
        if (sortBy === 'rating') {
            for (let i = 0; i < options.length; i++) {
                const providerKey = ctx.stub.createCompositeKey(providerPrefix, [options[i].providerId]);
                const providerBytes = await ctx.stub.getState(providerKey);
                if (providerBytes && providerBytes.length > 0) {
                    const providerData = JSON.parse(providerBytes.toString());
                    options[i].providerRating = providerData.rating;
                } else {
                    options[i].providerRating = 0;
                }
            }
        }
        if (sortBy === 'price') {
            options.sort((a, b) => a.basePrice - b.basePrice);
        } else if (sortBy === 'rating') {
            options.sort((a, b) => b.providerRating - a.providerRating);
        } else if (sortBy === 'transportMode') {
            options.sort((a, b) => a.transportMode.localeCompare(b.transportMode));
        }
        return options;
    }









    async getProviderTravelOptions(ctx) {
        const providerId = ctx.clientIdentity.getID();
        const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
        const providerBytes = await ctx.stub.getState(providerKey);
        if (!providerBytes || providerBytes.length === 0) {
            throw new Error('Provider not registered.');
        }
        let providerData = JSON.parse(providerBytes.toString());
        let travelOptions = [];
        for (const travelOptionId of providerData.travelOptions) {
            const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
            const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
            if (travelOptionBytes && travelOptionBytes.length > 0) {
                travelOptions.push(JSON.parse(travelOptionBytes.toString()));
            }
        }
        return travelOptions;
    }


    async getProviderDetails(ctx) {
        const providerId = ctx.clientIdentity.getID();
        const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
        const providerBytes = await ctx.stub.getState(providerKey);
        if (!providerBytes || providerBytes.length === 0) {
            throw new Error('Provider not registered.');
        }
        return providerBytes.toString();
    }

    /**
     * Rate a provider.
     * Allows a customer to rate the provider for a travel option after the travel date has passed.
     * The rating is averaged with previous ratings.
     * @param {Context} ctx The transaction context.
     * @param {String} ticketId The ticket identifier used to validate the travel.
     * @param {String} ratingStr The rating given by the customer (expected 0-5).
     * @param {String} currentTimestamp ISO timestamp representing current time.
     */
    async rateProvider(ctx, ticketId, ratingStr, currentTimestamp) {
        
        const ticketKey = ticketId;
        const ticketBytes = await ctx.stub.getState(ticketKey);
        if (!ticketBytes || ticketBytes.length === 0) {
            throw new Error('Ticket does not exist.');
        }
        const ticketData = JSON.parse(ticketBytes.toString());
        
        const customerId = ctx.clientIdentity.getID();
        if (ticketData.customerId !== customerId) {
            throw new Error('Not authorized to rate this provider.');
        }
      
        const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [ticketData.travelOptionId]);
        const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
        if (!travelOptionBytes || travelOptionBytes.length === 0) {
            throw new Error('Travel option does not exist.');
        }
        const travelOptionData = JSON.parse(travelOptionBytes.toString());
       
        const travelDateTime = new Date(`${travelOptionData.departureDate}T${travelOptionData.departureTime}`);
        const currentTime = new Date();
        if ((travelDateTime - currentTime) <= 1000) {
            throw new Error('Cannot rate provider before travel date.');
        }
     
        const newRating = parseFloat(ratingStr);
        if (isNaN(newRating) || newRating < 0 || newRating > 5) {
            throw new Error('Rating must be a number between 0 and 5.');
        }

        const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
        const providerBytes = await ctx.stub.getState(providerKey);
        if (!providerBytes || providerBytes.length === 0) {
            throw new Error('Provider not registered.');
        }
        let providerData = JSON.parse(providerBytes.toString());
        
        const currentNum = providerData.numRatings || 0;
        const currentAverage = providerData.rating || 0;
        const newAverage = ((currentAverage * currentNum) + newRating) / (currentNum + 1);
        providerData.rating = newAverage;
        providerData.numRatings = currentNum + 1;
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        return providerData;
    }
    
    
	async deleteCustomer(ctx) {
		const customerId = ctx.clientIdentity.getID();
		const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
		const customerBytes = await ctx.stub.getState(customerKey);
		if (!customerBytes || customerBytes.length === 0) {
			throw new Error('Customer not registered.');
		}
		let customerData = JSON.parse(customerBytes.toString());
	
		for (const ticketKey of customerData.bookings) {
			const ticketBytes = await ctx.stub.getState(ticketKey);
			if (ticketBytes && ticketBytes.length > 0) {
				let ticketData = JSON.parse(ticketBytes.toString());
				// Cancel only if ticket is active.
				if (ticketData.status === 'PENDING_CONFIRMATION' || ticketData.status === 'CONFIRMED') {
					const refundAmount = ticketData.pricePaid;
					// Retrieve travel option details.
					const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [ticketData.travelOptionId]);
					const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
					if (travelOptionBytes && travelOptionBytes.length > 0) {
						let travelOptionData = JSON.parse(travelOptionBytes.toString());
						// Increase available seats.
						travelOptionData.availableSeats += 1;
						await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));
						// Deduct refund from provider.
						const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
						const providerBytes = await ctx.stub.getState(providerKey);
						if (providerBytes && providerBytes.length > 0) {
							let providerData = JSON.parse(providerBytes.toString());
							providerData.balance -= refundAmount;
							await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
						}
					}
					// Mark the ticket as cancelled.
					ticketData.status = 'CANCELLED';
					await ctx.stub.putState(ticketKey, Buffer.from(JSON.stringify(ticketData)));
				}
			}
		}

		await ctx.stub.deleteState(customerKey);
		return { message: 'Customer account deleted and all active tickets cancelled with refunds processed.' };
	}


	async deleteProvider(ctx) {
		const providerId = ctx.clientIdentity.getID();
		const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
		const providerBytes = await ctx.stub.getState(providerKey);
		if (!providerBytes || providerBytes.length === 0) {
			throw new Error('Provider not registered.');
		}
		let providerData = JSON.parse(providerBytes.toString());
		// For each travel option of this provider.
		for (const travelOptionId of providerData.travelOptions) {
			const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
			const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
			if (travelOptionBytes && travelOptionBytes.length > 0) {
				let travelOptionData = JSON.parse(travelOptionBytes.toString());
				const now = DateTime.now().setZone('Asia/Kolkata'); // current time in IST
                const departureDateTime = DateTime.fromFormat(
                  `${travelOptionData.departureDate} ${travelOptionData.departureTime}`,
                  'yyyy-MM-dd HH:mm',
                  { zone: 'Asia/Kolkata' }
                );
				
				if(departureDateTime <= now){
				    continue;
				}
				// Cancel active bookings for this travel option.
				const iterator = await ctx.stub.getStateByPartialCompositeKey(ticketPrefix, [travelOptionId]);
				while (true) {
					const res = await iterator.next();
					if (res.value && res.value.value.toString()) {
						let ticket = JSON.parse(res.value.value.toString('utf8'));
						if (ticket.status === 'PENDING_CONFIRMATION' || ticket.status === 'CONFIRMED') {
							const refundAmount = ticket.pricePaid;
							// Refund the customer.
							const customerKey = ctx.stub.createCompositeKey(customerPrefix, [ticket.customerId]);
							const customerBytes = await ctx.stub.getState(customerKey);
							if (customerBytes && customerBytes.length > 0) {
								let customerData = JSON.parse(customerBytes.toString());
								customerData.balance += refundAmount;
								await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
							}
				
							providerData.balance -= refundAmount;
					
							ticket.status = 'CANCELLED';
							await ctx.stub.putState(res.value.key, Buffer.from(JSON.stringify(ticket)));
						}
					}
					if (res.done) {
						await iterator.close();
						break;
					}
				}
		
				travelOptionData.status = 'CANCELLED';
				travelOptionData.availableSeats = travelOptionData.seatCapacity;
				await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));
			}
		}
		
		await ctx.stub.deleteState(providerKey);
		return { message: 'Provider account deleted, all travel options cancelled and refunds processed.' };
	}
	
	
	/**
   * AUTO-CONFIRM TICKETS FOR A TRAVEL OPTION
   * If the current time is within 2 hours of departure, then:
   * - If pending tickets ≤ available seats, confirm all pending tickets.
   * - If pending tickets > available seats, confirm the earliest pending tickets up to available seats,
   *   and cancel (with full refund) the rest.
   */
  
    async autoConfirmTicketsForTravelOption(ctx, travelOptionId, currentTimestamp) {
   
      const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
      const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
      if (!travelOptionBytes || travelOptionBytes.length === 0) {
        throw new Error('Travel option does not exist.');
      }
      let travelOptionData = JSON.parse(travelOptionBytes.toString());

      const departureTime = new Date(`${travelOptionData.departureDate}T${travelOptionData.departureTime}`);
      const currentTime = new Date(currentTimestamp);
      const twoHoursMs = 2 * 60 * 60 * 1000;
   
      const iterator = await ctx.stub.getStateByPartialCompositeKey(ticketPrefix, [travelOptionId]);
      let pendingTickets = [];
      while (true) {
        const res = await iterator.next();
        if (res.value && res.value.value.toString()) {
          let ticket = JSON.parse(res.value.value.toString('utf8'));
          if (ticket.status === 'PENDING_CONFIRMATION') {
            pendingTickets.push(ticket);
          }
        }
        if (res.done) {
          await iterator.close();
          break;
        }
      }

      pendingTickets.sort((a, b) => new Date(a.bookingTime) - new Date(b.bookingTime));

      const vacantSeats = travelOptionData.availableSeats;
      let confirmedCount = 0;
      let cancelledCount = 0;

      if (pendingTickets.length <= vacantSeats) {
        for (const ticket of pendingTickets) {
          ticket.status = 'CONFIRMED';
          ticket.confirmationCount = 2;
          await ctx.stub.putState(ticket.ticketId, Buffer.from(JSON.stringify(ticket)));
          confirmedCount++;
        }
        // travelOptionData.availableSeats -= pendingTickets.length;
        await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));
      } else {
        
        for (let i = 0; i < pendingTickets.length; i++) {
          let ticket = pendingTickets[i];
          if (i < vacantSeats) {
            ticket.status = 'CONFIRMED';
            ticket.confirmationCount = 2;
            await ctx.stub.putState(ticket.ticketId, Buffer.from(JSON.stringify(ticket)));
            confirmedCount++;
          } else {
            // Process full refund: update customer and provider balances.
            const customerKey = ctx.stub.createCompositeKey(customerPrefix, [ticket.customerId]);
            const customerBytes = await ctx.stub.getState(customerKey);
            let customerData = JSON.parse(customerBytes.toString());
            customerData.balance += ticket.pricePaid;
            await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));

            const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
            const providerBytes = await ctx.stub.getState(providerKey);
            let providerData = JSON.parse(providerBytes.toString());
            providerData.balance -= ticket.pricePaid;
            await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));

            ticket.status = 'CANCELLED';
            await ctx.stub.putState(ticket.ticketId, Buffer.from(JSON.stringify(ticket)));
            cancelledCount++;
          }
        }
        travelOptionData.availableSeats = 0;
        await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));
      }

      return {
        message: `Auto-confirmed ${confirmedCount} ticket(s) and cancelled ${cancelledCount} ticket(s) for travel option ${travelOptionId}.`
      };
    }


  async getAllTravelOptions(ctx) {
    const iterator = await ctx.stub.getStateByPartialCompositeKey(travelOptionPrefix, []);
    let travelOptions = [];
    while (true) {
      const res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        travelOptions.push(JSON.parse(res.value.value.toString('utf8')));
      }
      if (res.done) {
        await iterator.close();
        break;
      }
    }
    return JSON.stringify(travelOptions);
  }
	
	
}

module.exports = TravelTicket;
