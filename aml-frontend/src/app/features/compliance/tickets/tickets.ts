import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplianceService, Ticket, TicketResponse } from '../../../core/services/compliance.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tickets.html',
  styleUrls: ['./tickets.css']
})
export class Tickets implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Filters
  filterStatus: string = 'all';
  filterPriority: string = 'all';
  searchQuery = '';

  // Ticket Detail Modal
  showTicketModal = false;
  selectedTicket: Ticket | null = null;
  ticketResponses: TicketResponse[] = [];
  loadingResponses = false;
  responseMessage = '';

  // Status update
  updatingStatus = false;
  updatingPriority = false;

  constructor(private complianceService: ComplianceService) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.complianceService.getMyTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        
        // Check if it's a 500 error (backend not implemented)
        if (error.status === 500) {
          this.errorMessage = 'Ticket system is not yet configured in the backend. Please contact your administrator.';
        } else if (error.status === 404) {
          this.errorMessage = 'Ticket endpoint not found. The backend may need to be updated.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to load tickets. Please try again later.';
        }
        
        this.isLoading = false;
        this.tickets = [];
        this.filteredTickets = [];
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tickets];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }

    // Filter by priority
    if (this.filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === this.filterPriority);
    }

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.subject.toLowerCase().includes(query) ||
        t.customerName.toLowerCase().includes(query) ||
        t.ticketId.toString().includes(query)
      );
    }

    this.filteredTickets = filtered;
  }

  openTicketDetails(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.showTicketModal = true;
    this.responseMessage = '';
    this.loadTicketResponses(ticket.ticketId);
  }

  loadTicketResponses(ticketId: number): void {
    this.loadingResponses = true;
    this.complianceService.getTicketResponses(ticketId).subscribe({
      next: (responses) => {
        this.ticketResponses = responses;
        this.loadingResponses = false;
      },
      error: (error) => {
        console.error('Error loading responses:', error);
        this.ticketResponses = [];
        this.loadingResponses = false;
      }
    });
  }

  closeTicketModal(): void {
    this.showTicketModal = false;
    this.selectedTicket = null;
    this.ticketResponses = [];
    this.responseMessage = '';
  }

  submitResponse(): void {
    if (!this.selectedTicket || !this.responseMessage.trim()) {
      this.errorMessage = 'Please provide a response message';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.complianceService.addTicketResponse(this.selectedTicket.ticketId, this.responseMessage).subscribe({
      next: (response) => {
        this.successMessage = 'Response sent successfully';
        this.ticketResponses.push(response);
        this.responseMessage = '';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error sending response:', error);
        this.errorMessage = error.error?.message || 'Failed to send response';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  updateStatus(newStatus: string): void {
    if (!this.selectedTicket) return;

    this.updatingStatus = true;
    this.complianceService.updateTicketStatus(this.selectedTicket.ticketId, newStatus).subscribe({
      next: (updatedTicket) => {
        this.successMessage = `Ticket status updated to ${newStatus}`;
        this.selectedTicket = updatedTicket;
        this.loadTickets();
        this.updatingStatus = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.errorMessage = error.error?.message || 'Failed to update status';
        this.updatingStatus = false;
        // Revert the status change in UI
        if (this.selectedTicket) {
          const originalTicket = this.tickets.find(t => t.ticketId === this.selectedTicket!.ticketId);
          if (originalTicket) {
            this.selectedTicket.status = originalTicket.status;
          }
        }
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  updatePriority(newPriority: string): void {
    if (!this.selectedTicket) return;

    this.updatingPriority = true;
    this.complianceService.updateTicketPriority(this.selectedTicket.ticketId, newPriority).subscribe({
      next: (updatedTicket) => {
        this.successMessage = `Ticket priority updated to ${newPriority}`;
        this.selectedTicket = updatedTicket;
        this.loadTickets();
        this.updatingPriority = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating priority:', error);
        this.errorMessage = error.error?.message || 'Failed to update priority';
        this.updatingPriority = false;
        // Revert the priority change in UI
        if (this.selectedTicket) {
          const originalTicket = this.tickets.find(t => t.ticketId === this.selectedTicket!.ticketId);
          if (originalTicket) {
            this.selectedTicket.priority = originalTicket.priority;
          }
        }
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  resolveTicket(): void {
    if (!this.selectedTicket || !this.responseMessage.trim()) {
      this.errorMessage = 'Please provide a resolution message';
      return;
    }

    if (confirm('Mark this ticket as resolved?')) {
      this.complianceService.resolveTicket(this.selectedTicket.ticketId, this.responseMessage).subscribe({
        next: (updatedTicket) => {
          this.successMessage = 'Ticket resolved successfully';
          this.selectedTicket = updatedTicket;
          this.loadTickets();
          this.closeTicketModal();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error resolving ticket:', error);
          this.errorMessage = 'Failed to resolve ticket';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const statusMap: any = {
      'OPEN': 'status-open',
      'IN_PROGRESS': 'status-in-progress',
      'RESOLVED': 'status-resolved',
      'CLOSED': 'status-closed'
    };
    return statusMap[status] || 'status-open';
  }

  getPriorityClass(priority: string): string {
    const priorityMap: any = {
      'LOW': 'priority-low',
      'MEDIUM': 'priority-medium',
      'HIGH': 'priority-high',
      'URGENT': 'priority-urgent'
    };
    return priorityMap[priority] || 'priority-medium';
  }

  getTicketCount(status: string): number {
    if (status === 'all') return this.tickets.length;
    return this.tickets.filter(t => t.status === status).length;
  }
}
