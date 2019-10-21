{{!< default}}
{{#contentFor 'script'}}
<script src="/public/js/team.js"></script>
{{/contentFor}}

<main class="container">
    <nav>
        <div class="nav nav-tabs" id="nav-tab" role="tablist">
            <a class="nav-item nav-link active" id="nav-home-tab" data-toggle="tab" href="#managedTeams" role="tab"
                aria-controls="nav-home" aria-selected="true">Managed Teams</a>
            <a class="nav-item nav-link" id="nav-profile-tab" data-toggle="tab" href="#joinedTeams" role="tab"
                aria-controls="nav-profile" aria-selected="false">Joined Teams</a>
            <a class="nav-item nav-link" id="nav-contact-tab" data-toggle="tab" href="#invites" role="tab"
                aria-controls="nav-contact" aria-selected="false">Invites</a>
        </div>
    </nav>
    <div class="tab-content" id="nav-tabContent">
        <div class="tab-pane fade show active" id="managedTeams" role="tabpanel" aria-labelledby="nav-home-tab">
            managedTeams
        </div>
        <div class="tab-pane fade" id="joinedTeams" role="tabpanel" aria-labelledby="nav-profile-tab">Joined</div>
        <div class="tab-pane fade" id="invites" role="tabpanel" aria-labelledby="nav-contact-tab">invites</div>
    </div>
</main>">...</default>