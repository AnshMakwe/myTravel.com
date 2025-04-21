'use strict';

const { Contract } = require('fabric-contract-api');

const customerPrefix = 'customer';
const providerPrefix = 'provider';
const travelOptionPrefix = 'travelOption';
const ticketPrefix = 'ticket';

class TravelTicket extends Contract {

    /**
     * Initialize the ledger.
     * Optionally add pre-defined travel options or sample data.
     */
    async initLedger(ctx) {
        console.info('=== Initializing Ledger ===');
        // Optionally add pre-defined travel options or sample data here.
        console.info('Ledger initialization complete.');
    }

    /**
     * Register a new customer.
     * @param {Context} ctx The transaction context.
     * @param {String} name Customer name.
     * @param {String} contact Customer contact details.
     */
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
        await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
        return customerData;
    }

    /**
     * Register a new service provider.
     * @param {Context} ctx The transaction context.
     * @param {String} name Provider name.
     * @param {String} contact Provider contact details.
     * @param {Number} rating Provider rating (optional).
     */
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
            balance: 0,         // provider starts with zero balance
            travelOptions: []   // list of travel option IDs
        };
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        return providerData;
    }

    /**
     * Update customer details.
     * Optionally mark the profile as anonymous (contact info set to null).
     */
    async updateCustomerDetails(ctx, newName, newContact, isAnonymous) {
        const customerId = ctx.clientIdentity.getID();
        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        if (!customerBytes || customerBytes.length === 0) {
            throw new Error('Customer not registered.');
        }
        let customerData = JSON.parse(customerBytes.toString());
        customerData.name = isAnonymous ? '_____' : (newName || customerData.name);
        customerData.contact = isAnonymous ? null : (newContact || customerData.contact);
        await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
        return customerData;
    }
    
    /**
     * Deposit funds into the customer's wallet.
     * @param {Context} ctx The transaction context.
     * @param {String} amount The amount to deposit.
     */
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

    /**
     * Update provider details.
     * Optionally mark the profile as anonymous (contact info set to null).
     */
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
        providerData.rating = (newRating !== undefined) ? newRating : providerData.rating;
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        return providerData;
    }

    /**
     * Provider adds a new travel option.
     * @param {Context} ctx The transaction context.
     * @param {String} source Starting location.
     * @param {String} destination Destination.
     * @param {String} departureDate Date of departure (ISO string recommended).
     * @param {String} departureTime Departure time.
     * @param {String} transportMode Mode of transport (plane, train, bus).
     * @param {Number} seatCapacity Total seats available.
     * @param {Number} basePrice Base ticket price.
     */
    async addTravelOption(ctx, source, destination, departureDate, departureTime, transportMode, seatCapacity, basePrice) {
        const providerId = ctx.clientIdentity.getID();
        const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
        const providerBytes = await ctx.stub.getState(providerKey);
        if (!providerBytes || providerBytes.length === 0) {
            throw new Error('Provider not registered.');
        }
        let providerData = JSON.parse(providerBytes.toString());
        const txTimestamp = ctx.stub.getTxTimestamp();
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
            seatCapacity: parseInt(seatCapacity),
            availableSeats: parseInt(seatCapacity),
            basePrice: parseFloat(basePrice)
        };
        await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));
        // let providerData = JSON.parse(providerBytes.toString());
        providerData.travelOptions.push(travelOptionId);
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        return travelOptionData;
    }

    /**
     * List travel options matching source and destination.
     */
    async listTravelOptions(ctx, source, destination) {
        const iterator = await ctx.stub.getStateByPartialCompositeKey(travelOptionPrefix, []);
        const options = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const record = JSON.parse(res.value.value.toString('utf8'));
                if (record.source === source && record.destination === destination) {
                    options.push(record);
                }
            }
            if (res.done) {
                await iterator.close();
                return options;
            }
        }
    }

    /**
     * List travel options sorted by criteria with additional filtering:
     * price range, specific provider, and availability.
     * @param {Context} ctx The transaction context.
     * @param {String} source Starting location.
     * @param {String} destination Destination.
     * @param {String} sortBy One of 'price', 'rating', or 'transportMode'.
     * @param {String} [minPrice] (Optional) Minimum price filter.
     * @param {String} [maxPrice] (Optional) Maximum price filter.
     * @param {String} [filterProviderId] (Optional) Specific provider ID filter.
     * @param {String} [onlyAvailable] (Optional) "true" to include only options with available seats.
     */
    async listTravelOptionsSorted1(ctx, source, destination, sortBy, minPrice, maxPrice, filterProviderId, onlyAvailable) {
        let options = await this.listTravelOptions(ctx, source, destination);
     
        // Filter by availability.
        if (onlyAvailable && onlyAvailable.toLowerCase() === 'true') {
            options = options.filter(opt => opt.availableSeats > 0);
        }
        // Filter by price range.
        if (minPrice) {
            options = options.filter(opt => parseFloat(opt.basePrice) >= parseFloat(minPrice));
        }
        if (maxPrice) {
            options = options.filter(opt => parseFloat(opt.basePrice) <= parseFloat(maxPrice));
        }
        // Filter by a specific provider.
        if (filterProviderId) {
            options = options.filter(opt => opt.serviceProvider === filterProviderId);
        }
        // Enrich options with provider rating if sorting by rating.
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
        // Sorting logic.
        if (sortBy === 'price') {
            options.sort((a, b) => a.basePrice - b.basePrice);
        } else if (sortBy === 'rating') {
            options.sort((a, b) => b.providerRating - a.providerRating);
        } else if (sortBy === 'transportMode') {
            options.sort((a, b) => a.transportMode.localeCompare(b.transportMode));
        }
        return options;
    }

    /**
     * Book a ticket for a given travel option.
     * Implements dummy payment and dynamic pricing using a deterministic timestamp.
     * Added simulation for block confirmations.
     * @param {Context} ctx The transaction context.
     * @param {String} travelOptionId The travel option identifier.
     */
    async bookTicket(ctx, travelOptionId) {
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
        if (travelOptionData.availableSeats <= 0) {
            throw new Error('No seats available.');
        }

        const bookedSeats = travelOptionData.seatCapacity - travelOptionData.availableSeats;
        const occupancyFactor = bookedSeats / travelOptionData.seatCapacity;
        const dynamicFactor = 0.5;
        const dynamicPrice = travelOptionData.basePrice * (1 + occupancyFactor * dynamicFactor);
        const maxPrice = travelOptionData.basePrice * 1.5;
	    if (dynamicPrice > maxPrice) {
	        dynamicPrice = maxPrice;
	    }

        if (customerData.balance < dynamicPrice) {
            throw new Error('Insufficient balance for booking.');
        }
        customerData.balance -= dynamicPrice;

        const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
        const providerBytes = await ctx.stub.getState(providerKey);
        let providerData = JSON.parse(providerBytes.toString());
        providerData.balance += dynamicPrice;

        await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));

        const seatNumber = travelOptionData.seatCapacity - travelOptionData.availableSeats + 1;
        travelOptionData.availableSeats -= 1;
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
            seatNumber,
            bookingTime,
            timestamp,
            pricePaid: dynamicPrice,
            // New fields for confirmation simulation and pricing transparency:
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

    /**
     * Confirm a ticket by simulating additional block confirmations.
     * This function increments the ticket's confirmation count.
     * When the confirmation count reaches 2 or more, the ticket status is updated to "CONFIRMED".
     * @param {Context} ctx The transaction context.
     * @param {String} ticketId The ticket identifier.
     */
     /**
   * CONFIRM TICKET
   * Increments the confirmation count; when it reaches 2, status becomes "CONFIRMED".
   */
      /**
     * Confirm a ticket by simulating additional block confirmations.
     * Increments the confirmation count; when it reaches 2, status becomes "CONFIRMED".
     */
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



    /**
     * Cancel an existing ticket.
     * Refunds the customer if cancellation is made more than 2 days before departure.
     * @param {Context} ctx The transaction context.
     * @param {String} ticketId The ticket identifier.
     * @param {String} currentTimestamp ISO timestamp representing current time.
     */
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
        let refundAmount = 0;
        if ((departureTime - currentTime) >= msInTwoDays) {
            refundAmount = ticketData.pricePaid;
        }
        ticketData.status = 'CANCELLED';
        await ctx.stub.putState(ticketKey, Buffer.from(JSON.stringify(ticketData)));

        travelOptionData.availableSeats += 1;
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

    /**
     * Reschedule an existing ticket.
     * Cancels the old ticket and books a new ticket for a different travel option.
     * A penalty of 10% is charged if rescheduling is within 2 days of departure.
     * @param {Context} ctx The transaction context.
     * @param {String} ticketId The existing ticket ID.
     * @param {String} newTravelOptionId The new travel option ID.
     * @param {String} currentTimestamp ISO timestamp representing current time.
     */
    /**
 * Reschedule an existing ticket.
 * - Cancels the old ticket (processing refund if cancelled > 2 days before departure)
 * - Books a new ticket for the new travel option at full base price.
 * - Returns the newly booked ticket.
 * @param {Context} ctx The transaction context.
 * @param {String} ticketId The existing ticket ID (Base64-encoded composite key).
 * @param {String} newTravelOptionId The new travel option identifier.
 * @param {String} currentTimestamp ISO timestamp representing current time.
 */
    async rescheduleTicket(ctx, encodedTicketId, newTravelOptionId, currentTimestamp) {
        // Decode the old ticket composite key
        const ticketBytes = await ctx.stub.getState(encodedTicketId);
        if (!ticketBytes || ticketBytes.length === 0) {
            throw new Error('Ticket does not exist.');
        }
        let oldTicket = JSON.parse(ticketBytes.toString());
        if (oldTicket.status !== 'PENDING_CONFIRMATION' && oldTicket.status !== 'CONFIRMED') {
            throw new Error('Only active tickets can be rescheduled.');
        }

        // Retrieve old travel option details
        const oldTravelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [oldTicket.travelOptionId]);
        const oldTravelOptionBytes = await ctx.stub.getState(oldTravelOptionKey);
        if (!oldTravelOptionBytes || oldTravelOptionBytes.length === 0) {
            throw new Error('Old travel option does not exist.');
        }
        let oldTravelOption = JSON.parse(oldTravelOptionBytes.toString());

        // Calculate refund amount using cancellation rules:
        const departureTime = new Date(`${oldTravelOption.departureDate}T${oldTravelOption.departureTime}`);
        const currentTime = new Date(currentTimestamp);
        const msInTwoDays = 2 * 24 * 60 * 60 * 1000;
        let refundAmount = 0;
        if ((departureTime - currentTime) >= msInTwoDays) {
            refundAmount = oldTicket.pricePaid;
        }

        // Cancel the old ticket
        oldTicket.status = 'CANCELLED';
        await ctx.stub.putState(encodedTicketId, Buffer.from(JSON.stringify(oldTicket)));

        // Increment available seats in the old travel option
        oldTravelOption.availableSeats += 1;
        await ctx.stub.putState(oldTravelOptionKey, Buffer.from(JSON.stringify(oldTravelOption)));

        // Process refund: update customer and provider balances
        const customerId = ctx.clientIdentity.getID();
        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        let customerData = JSON.parse(customerBytes.toString());
        if (refundAmount > 0) {
            customerData.balance += refundAmount;
            const providerKey = ctx.stub.createCompositeKey(providerPrefix, [oldTravelOption.providerId]);
            const providerBytes = await ctx.stub.getState(providerKey);
            let providerData = JSON.parse(providerBytes.toString());
            providerData.balance -= refundAmount;
            await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        }
        await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));

        // Book a new ticket for the new travel option.
        // We call the existing bookTicket function.
        const newTicket = await this.bookTicket(ctx, newTravelOptionId);
        
        // Now override newTicket.pricePaid to be exactly the basePrice of the new travel option.
        const newTravelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [newTravelOptionId]);
        const newTravelOptionBytes = await ctx.stub.getState(newTravelOptionKey);
        if (!newTravelOptionBytes || newTravelOptionBytes.length === 0) {
            throw new Error('New travel option does not exist.');
        }
        let newTravelOption = JSON.parse(newTravelOptionBytes.toString());
        // Charge full base price
        const fullPrice = newTravelOption.basePrice;
        // If bookTicket originally charged less than full price, deduct the difference.
        if (newTicket.pricePaid < fullPrice) {
            const diff = fullPrice - newTicket.pricePaid;
            if (customerData.balance < diff) {
                throw new Error('Insufficient balance to pay full price for the new ticket.');
            }
            customerData.balance -= diff;
            newTicket.pricePaid = fullPrice;
            // Credit provider the extra difference
            const providerKey = ctx.stub.createCompositeKey(providerPrefix, [newTravelOption.providerId]);
            const providerBytes = await ctx.stub.getState(providerKey);
            let providerData = JSON.parse(providerBytes.toString());
            providerData.balance += diff;
            await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
            await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
        }

        newTicket.rescheduledFrom = oldTicket.ticketId; // record the old ticket reference
        // Save the new ticket update.
        await ctx.stub.putState(newTicket.ticketId, Buffer.from(JSON.stringify(newTicket)));
        return newTicket;
    }





    /**
     * Delete a travel option.
     * Allows a provider to remove a travel option if there are no active bookings.
     * @param {Context} ctx The transaction context.
     * @param {String} travelOptionId The travel option identifier.
     */
    async deleteTravelOption(ctx, travelOptionId) {
        const providerId = ctx.clientIdentity.getID();
        const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
        const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
        if (!travelOptionBytes || travelOptionBytes.length === 0) {
            throw new Error('Travel option does not exist.');
        }
        const travelOptionData = JSON.parse(travelOptionBytes.toString());
        if (travelOptionData.providerId !== providerId) {
            throw new Error('Not authorized to delete this travel option.');
        }
        if (travelOptionData.availableSeats !== travelOptionData.seatCapacity) {
            throw new Error('Cannot delete travel option with active bookings.');
        }
        await ctx.stub.deleteState(travelOptionKey);
        return { message: 'Travel option deleted successfully.' };
    }

    /**
     * Provider cancels an existing travel listing.
     * Refunds all active bookings and marks the travel option as cancelled.
     * @param {Context} ctx The transaction context.
     * @param {String} travelOptionId The travel option identifier.
     */
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

    const iterator = await ctx.stub.getStateByPartialCompositeKey(ticketPrefix, [travelOptionId]);
    
    // Fetch provider data **once**, after processing all tickets
    // const providerKey = ctx.stub.createCompositeKey(providerPrefix, [providerId]);
    // const providerBytes = await ctx.stub.getState(providerKey);
    // let providerData = JSON.parse(providerBytes.toString());
    
    
    
    let ticketsToCancel = [];
    let totalRefund = 0; // Track total refund amount

    while (true) {
        const res = await iterator.next();
        if (res.value && res.value.value.toString()) {
            let ticket = JSON.parse(res.value.value.toString('utf8'));
            if (ticket.status === 'PENDING_CONFIRMATION' || ticket.status === 'CONFIRMED') {
                ticketsToCancel.push({ key: res.value.key, ticket });
                totalRefund += ticket.pricePaid; // Accumulate total refund amount
            }
        }
        if (res.done) {
            await iterator.close();
            break;
        }
    }

    for (const entry of ticketsToCancel) {
        let ticket = entry.ticket;
        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [ticket.customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        
        if (customerBytes && customerBytes.length > 0) {
            let customerData = JSON.parse(customerBytes.toString());
            customerData.balance += ticket.pricePaid; // Refund customer
            await ctx.stub.putState(customerKey, Buffer.from(JSON.stringify(customerData)));
        }

        ticket.status = 'CANCELLED';
        await ctx.stub.putState(entry.key, Buffer.from(JSON.stringify(ticket)));
    }
    
    
    const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
    const providerBytes = await ctx.stub.getState(providerKey);
    let providerData = JSON.parse(providerBytes.toString());
    providerData.balance -= totalRefund; // Deduct total refund amount from provider's balance
    await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));

    travelOptionData.status = 'CANCELLED';
    travelOptionData.availableSeats = travelOptionData.seatCapacity;
    await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));

    return { message: `Travel listing cancelled, ${ticketsToCancel.length} bookings refunded, total refund: ${totalRefund}` };
}


    /**
     * Get all tickets booked by the invoking customer.
     * @param {Context} ctx The transaction context.
     */
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

    /**
     * Get details of the invoking customer.
     * @param {Context} ctx The transaction context.
     */
    async getCustomerDetails(ctx) {
        const customerId = ctx.clientIdentity.getID();
        const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
        const customerBytes = await ctx.stub.getState(customerKey);
        if (!customerBytes || customerBytes.length === 0) {
            throw new Error('Customer not registered.');
        }
        return customerBytes.toString();
    }

    /**
     * Get details of a specific ticket.
     * @param {Context} ctx The transaction context.
     * @param {String} ticketId The ticket identifier.
     */
    async getTicketDetails(ctx, encodedTicketId) {
        const compositeKey = encodedTicketId;
        //const compositeKey = Buffer.from(encodedTicketId, 'base64').toString('utf8');
        const ticketBytes = await ctx.stub.getState(compositeKey);
        if (!ticketBytes || ticketBytes.length === 0) {
            throw new Error('Ticket does not exist.');
        }
        return ticketBytes.toString();
}




    /**
     * Get all travel options registered by the invoking provider.
     * @param {Context} ctx The transaction context.
     */
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

    /**
     * Get provider details (including balance) for UI.
     * @param {Context} ctx The transaction context.
     */
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
        // Retrieve ticket to validate the travel.
        const ticketKey = ticketId;
        const ticketBytes = await ctx.stub.getState(ticketKey);
        if (!ticketBytes || ticketBytes.length === 0) {
            throw new Error('Ticket does not exist.');
        }
        const ticketData = JSON.parse(ticketBytes.toString());
        // Ensure the caller is the same as the ticket's customer.
        const customerId = ctx.clientIdentity.getID();
        if (ticketData.customerId !== customerId) {
            throw new Error('Not authorized to rate this provider.');
        }
        // Retrieve travel option to check travel date.
        const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [ticketData.travelOptionId]);
        const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
        if (!travelOptionBytes || travelOptionBytes.length === 0) {
            throw new Error('Travel option does not exist.');
        }
        const travelOptionData = JSON.parse(travelOptionBytes.toString());
        // Check that currentTimestamp is after travel date.
        const travelDateTime = new Date(`${travelOptionData.departureDate}T${travelOptionData.departureTime}`);
        const currentTime = new Date(currentTimestamp);
        if (currentTime < travelDateTime) {
            throw new Error('Cannot rate provider before travel date.');
        }
        // Validate rating.
        const newRating = parseFloat(ratingStr);
        if (isNaN(newRating) || newRating < 0 || newRating > 5) {
            throw new Error('Rating must be a number between 0 and 5.');
        }
        // Retrieve provider details.
        const providerKey = ctx.stub.createCompositeKey(providerPrefix, [travelOptionData.providerId]);
        const providerBytes = await ctx.stub.getState(providerKey);
        if (!providerBytes || providerBytes.length === 0) {
            throw new Error('Provider not registered.');
        }
        let providerData = JSON.parse(providerBytes.toString());
        // Compute new average rating.
        const currentNum = providerData.numRatings || 0;
        const currentAverage = providerData.rating || 0;
        const newAverage = ((currentAverage * currentNum) + newRating) / (currentNum + 1);
        providerData.rating = newAverage;
        providerData.numRatings = currentNum + 1;
        await ctx.stub.putState(providerKey, Buffer.from(JSON.stringify(providerData)));
        return providerData;
    }
    
    	/**
	 * Delete the customer account.
	 * Cancels all active tickets (PENDING_CONFIRMATION or CONFIRMED) and processes full refunds.
	 * Finally, deletes the customer record.
	 */
	async deleteCustomer(ctx) {
		const customerId = ctx.clientIdentity.getID();
		const customerKey = ctx.stub.createCompositeKey(customerPrefix, [customerId]);
		const customerBytes = await ctx.stub.getState(customerKey);
		if (!customerBytes || customerBytes.length === 0) {
			throw new Error('Customer not registered.');
		}
		let customerData = JSON.parse(customerBytes.toString());
		// Iterate over all ticket composite keys in customer bookings.
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
		// Delete the customer record.
		await ctx.stub.deleteState(customerKey);
		return { message: 'Customer account deleted and all active tickets cancelled with refunds processed.' };
	}

	/**
	 * Delete the provider account.
	 * Cancels all travel options and, for each, cancels active bookings (with full refunds).
	 * Finally, deletes the provider record.
	 */
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
							// Deduct refund from provider.
							providerData.balance -= refundAmount;
							// Mark ticket as cancelled.
							ticket.status = 'CANCELLED';
							await ctx.stub.putState(res.value.key, Buffer.from(JSON.stringify(ticket)));
						}
					}
					if (res.done) {
						await iterator.close();
						break;
					}
				}
				// Mark travel option as cancelled.
				travelOptionData.status = 'CANCELLED';
				travelOptionData.availableSeats = travelOptionData.seatCapacity;
				await ctx.stub.putState(travelOptionKey, Buffer.from(JSON.stringify(travelOptionData)));
			}
		}
		// Delete the provider record.
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
   /**
     * AUTO-CONFIRM TICKETS FOR A TRAVEL OPTION  
     * If the current time is within 2 hours of departure, then:
     * - If pending tickets ≤ available seats, confirm all pending tickets.
     * - If pending tickets > available seats, confirm the earliest pending tickets up to available seats,
     *   and cancel (with full refund) the rest.
     */
    async autoConfirmTicketsForTravelOption(ctx, travelOptionId, currentTimestamp) {
      // Retrieve travel option.
      const travelOptionKey = ctx.stub.createCompositeKey(travelOptionPrefix, [travelOptionId]);
      const travelOptionBytes = await ctx.stub.getState(travelOptionKey);
      if (!travelOptionBytes || travelOptionBytes.length === 0) {
        throw new Error('Travel option does not exist.');
      }
      let travelOptionData = JSON.parse(travelOptionBytes.toString());

      const departureTime = new Date(`${travelOptionData.departureDate}T${travelOptionData.departureTime}`);
      const currentTime = new Date(currentTimestamp);
      const twoHoursMs = 2 * 60 * 60 * 1000;
      // Query pending tickets for this travel option.
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

      // Sort pending tickets by bookingTime (earliest first)
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
        // Confirm only the earliest pending tickets up to vacantSeats.
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


  /**
   * GET ALL TRAVEL OPTIONS
   * Returns all travel options on the ledger.
   */
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




