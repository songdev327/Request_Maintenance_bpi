import NavbarPro from "./NavbarPro";
import SidebarPro from "./SidebarPro";

function TemplatePro (props) {
    return (
        <>
          <div>
            <NavbarPro />
            <SidebarPro />

            <div class="content-wrapper pt-3 ml-2">
                 <section class="content">
                     {props.children}
                 </section>
            </div>
          </div>

        </>
    )
}

export default TemplatePro;
